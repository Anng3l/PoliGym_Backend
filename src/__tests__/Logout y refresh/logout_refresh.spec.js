import { refreshTokenController, logOutController } from '../../controllers/auth_controller.js';
import { createToken } from '../../middlewares/auth.js';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../middlewares/auth.js');

describe('Auth Controllers', () => {

  let req;
  let res;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('refreshTokenController', () => {

    it('debe responder con 401 si no hay refreshToken en la cookie', async () => {
      await refreshTokenController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: "Cookie no provista" });
    });

    it('debe responder con 403 si el token expiró', async () => {
      req.cookies.refreshToken = 'fakeToken';
      jwt.verify.mockImplementation((token, secret, cb) => {
        cb({ name: 'TokenExpiredError' }, null);
      });

      await refreshTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: "Refresh token expirado. Vuelva a iniciar sesión." });
    });

    it('debe responder con 401 si el token es inválido', async () => {
      req.cookies.refreshToken = 'fakeToken';
      jwt.verify.mockImplementation((token, secret, cb) => {
        cb({ name: 'JsonWebTokenError' }, null);
      });

      await refreshTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: "Refresh token inválido." });
    });

    it('debe devolver accessJwt si el token es válido', async () => {
      const decoded = { _id: '123', role: 'user' };
      req.cookies.refreshToken = 'validToken';

      jwt.verify.mockImplementation((token, secret, cb) => {
        cb(null, decoded);
      });

      createToken.mockResolvedValue('newAccessToken');

      await refreshTokenController(req, res);

      expect(createToken).toHaveBeenCalledWith({ _id: '123', role: 'user' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessJwt: 'newAccessToken',
        role: 'user',
        _id: '123'
      });
    });
    
  });

  describe('logOutController', () => {

    it('debe responder con 203 si no hay refreshToken', async () => {
      await logOutController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Cookie o jwt no enviado" });
    });

    it('debe limpiar la cookie y responder con 200', async () => {
      req.cookies.refreshToken = 'someToken';

      await logOutController(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        msg: "JWT de refresco eliminado exitosamente del usuario"
      });
    });

    it('debe manejar errores en logout', async () => {
      req.cookies.refreshToken = 'token';

    // Simula un error lanzado directamente por jwt.verify para que entre al catch
    jwt.verify.mockImplementation(() => {
        throw new Error('Fallo interno');
    });

    await refreshTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        msg: "Error en la generación de nuevo JWT",
        error: "Fallo interno"
    }));
    });

  });

});
