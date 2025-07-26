import { registerController, verificacionDeRegistroController } from "../../controllers/auth_controller.js";
import User from "../../models/users_model.js";
import { validationResult, check } from "express-validator";
import nodemailerMethods from "../../config/nodemailer.js";

// Mock completo de express-validator dentro del mismo archivo
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
  check: jest.fn(() => ({
    isLength: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    isStrongPassword: jest.fn().mockReturnThis(),
    isAlphanumeric: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    run: jest.fn().mockResolvedValue(true)
  })),
  body: jest.fn().mockReturnThis()
}));

jest.mock("../../models/users_model.js");
jest.mock("../../config/nodemailer.js");

describe("Registrar cliente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuración específica para validationResult
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
      formatWith: jest.fn().mockReturnThis(),
      throw: jest.fn()
    });
  });

  it("debe registrar correctamente a un nuevo usuario", async () => {
    const req = {
      body: {
        username: "testuser",
        name: "Test",
        lastname: "User",
        email: "test@epn.edu.ec",
        password: "Password1@_",
        confirmPassword: "Password1@_"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock para User.findOne
    User.findOne
      .mockResolvedValueOnce(null)  // Para el correo
      .mockResolvedValueOnce(null); // Para el username

    const mockUserInstance = {
      username: "testuser",
      name: "Test",
      lastname: "User",
      email: "test@epn.edu.ec",
      password: "Password1@_",
      role: "cliente",
      token: "fakeToken",
      confirmEmail: false,
      encryptPassword: jest.fn().mockResolvedValue("hashedPassword"),
      createToken: jest.fn().mockReturnValue("fakeToken"),
      save: jest.fn().mockResolvedValue(true)
    };

    User.mockImplementation(() => mockUserInstance);
    nodemailerMethods.sendMailToUser.mockResolvedValue(true);

    await registerController(req, res);

    // Verificaciones
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Usuario testuser registrado satisfactoriamente",
    });
  });
});

describe("Verificacion de registro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe confirmar el registro correctamente con token válido", async () => {
    const mockUser = {
      email: "test@epn.edu.ec",
      token: "token123",
      confirmEmail: false,
      save: jest.fn().mockImplementation(function() {
        this.token = null;
        this.confirmEmail = true;
        return Promise.resolve(this);
      })
    };

    const req = {
      query: {
        token: "token123",
        email: "test@epn.edu.ec",
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findOne.mockResolvedValue(mockUser);

    await verificacionDeRegistroController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ msg: "Registro confirmado satisfactoriamente" });
  });

  it("debe retornar error si la cuenta ya está confirmada (token es null)", async () => {
    const mockUser = {
      email: "test@epn.edu.ec",
      token: null,
      confirmEmail: true,
      save: jest.fn()
    };

    const req = {
      query: {
        token: "token123",
        email: "test@epn.edu.ec",
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findOne.mockResolvedValue(mockUser);

    await verificacionDeRegistroController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("debe manejar correctamente cuando no se encuentra el usuario", async () => {
    const req = {
      query: {
        token: "token123",
        email: "noexiste@epn.edu.ec",
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findOne.mockResolvedValue(null);

    await verificacionDeRegistroController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});