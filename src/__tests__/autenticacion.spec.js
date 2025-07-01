// tests/logInController.test.js
import { logInController, registerController } from "../controllers/auth_controller.js"; // Ajusta la ruta si es necesario
import User from "../models/users_model.js";
import bcrypt from "bcrypt";
import { createToken } from "../middlewares/auth.js";
import nodemailerMethods from "../config/nodemailer.js";



jest.mock("../models/users_model.js");
jest.mock("bcrypt");
jest.mock("../middlewares/auth.js");
jest.mock("../config/nodemailer.js");

const getMockRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { res: { status }, json };
};


const mockRequest = (body = {}) => ({ body });
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};


describe("Inicio de sesión", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };
    const mock = getMockRes();
    res = mock.res;
  });

  it("debe retornar 400 si hay campos vacíos", async () => {
    req.body.password = "";

    await logInController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      msg: "Todos los campos son obligatorios",
    });
  });

  it("debe retornar 404 si el usuario no existe", async () => {
    User.findOne.mockResolvedValue(null);

    await logInController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status().json).toHaveBeenCalledWith({
      msg: "Credenciales incorrectas",
    });
  });

  it("debe retornar 404 si la contraseña no coincide", async () => {
    User.findOne.mockResolvedValue({ password: "hashedpass" });
    bcrypt.compare.mockResolvedValue(false);

    await logInController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status().json).toHaveBeenCalledWith({
      msg: "Credenciales incorrectas",
    });
  });

  it("debe retornar 200 y un token si login es exitoso", async () => {
    const mockUser = {
      _id: "mockId",
      role: "user",
      username: "testuser",
      name: "Test",
      lastname: "User",
      password: "hashedpass",
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    createToken.mockResolvedValue("mockedToken");

    await logInController(req, res);

    expect(createToken).toHaveBeenCalledWith({ _id: mockUser._id, role: mockUser.role });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith({
      token: "mockedToken",
      role: "user",
      _id: "mockId",
      username: "testuser",
      name: "Test",
      lastname: "User",
    });
  });

  it("debe retornar 500 si ocurre un error inesperado", async () => {
    User.findOne.mockImplementation(() => { throw new Error("Unexpected") });

    await logInController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        succes: false,
        msg: expect.any(String),
        error: expect.any(String),
      })
    );
  });
});
