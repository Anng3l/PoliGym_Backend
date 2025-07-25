import { recoverPasswordMailingController, confirmTokenController, recoverPasswordController } from '../../controllers/auth_controller.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../../models/users_model.js';
import * as nodemailerMethods from '../../config/nodemailer.js';

jest.mock('../../models/users_model.js');
jest.mock('../../config/nodemailer.js');
jest.mock('../../config/nodemailer.js', () => ({
  sendMailToUserRecovery: jest.fn()
}));

jest.mock('express-validator', () => ({
  check: jest.fn(() => ({
    isEmail: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    isStrongPassword: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    run: jest.fn().mockResolvedValue(),
  })),
  validationResult: jest.fn()
}));


describe('Enviar correo para restablecimiento de contraseña', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: 'test@example.com' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debe retornar error si email no es válido', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Email inválido' }]
    });

    await recoverPasswordMailingController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Errores de validación' }));
  });

  it('debe retornar error si no se encuentra usuario', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });
    User.findOne.mockResolvedValueOnce(null);

    await recoverPasswordMailingController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'No existe usuario con ese correo' });
  });
  it('debe retornar error si el correo no está confirmado', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    const fakeUser = {
      confirmEmail: false
    };

    User.findOne.mockResolvedValueOnce(fakeUser);

    await recoverPasswordMailingController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Confirme su correo electrónico antes de recuperar su contraseña"
    });
  });

  it('debe enviar correo y guardar usuario', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });
    const saveMock = jest.fn();
    const fakeUser = {
      _id: new mongoose.Types.ObjectId(),
      createToken: () => 'token123',
      save: saveMock
    };
    User.findOne.mockResolvedValueOnce(fakeUser);

    await recoverPasswordMailingController(req, res);

    expect(nodemailerMethods.sendMailToUserRecovery).toHaveBeenCalledWith('test@example.com', 'token123', fakeUser._id.toString());
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('Confirmar identidad para restablecer contraseña', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
  });

  it('debe retornar error si falta token', async () => {
    req.query = { userId: '123456789012' };

    await confirmTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it('debe retornar error si userId es inválido', async () => {
    req.query = { token: 'token123', userId: 'invalid-id' };

    await confirmTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it('debe confirmar token correctamente', async () => {
    const id = new mongoose.Types.ObjectId();
    req.query = { token: 'token123', userId: id.toString() };
    const fakeUser = { save: jest.fn() };
    User.findOne.mockResolvedValueOnce(fakeUser);

    await confirmTokenController(req, res);
    expect(fakeUser.recoverPassword).toBe(true);
    expect(fakeUser.token).toBe(null);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('Restablecer contraseña', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        idUser: new mongoose.Types.ObjectId().toString(),
        password: 'Test@1234',
        confirmPassword: 'Test@1234'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn()
    };
  });

  it('debe retornar error si hay errores de validación', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Error de validación' }]
    });

    await recoverPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('debe retornar error si los campos están vacíos', async () => {
    req.body.password = '';
    req.body.confirmPassword = '';
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    await recoverPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it('debe retornar error si contraseñas no coinciden', async () => {
    const fakeUser = {
        _id: new mongoose.Types.ObjectId(),
        recoverPassword: true,
        encryptPassword: jest.fn(),
        save: jest.fn()
    };

    User.findOne.mockResolvedValue(fakeUser);

    req.body = {
        idUser: fakeUser._id.toString(),
        password: 'Password123@',
        confirmPassword: 'Password456@'
    };

    validationResult.mockReturnValue({ isEmpty: () => true });

    await recoverPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Las contraseñas no son las mismas' });
    });


  it('debe cambiar contraseña correctamente', async () => {
    const saveMock = jest.fn();
    const encryptPasswordMock = jest.fn().mockResolvedValue('hashedPassword');

    const fakeUser = {
      recoverPassword: true,
      token: 'token123',
      save: saveMock,
      encryptPassword: encryptPasswordMock
    };

    User.findOne.mockResolvedValueOnce(fakeUser);
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    await recoverPasswordController(req, res);
    expect(fakeUser.token).toBe(null);
    expect(fakeUser.recoverPassword).toBe(false);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Contraseña restablecida exitosamente' });
  });
});
