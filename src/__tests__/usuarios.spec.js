import { getAllUsersController, getOneUserController, getUsersByRoleController, createUserController, updateUserController, deleteOneUserController } from "../controllers/user_controller.js";
import User from "../models/users_model.js";

import bcrypt from "bcrypt";
import nodemailerMethods from "../config/nodemailer";
/*
// Mock del modelo User
jest.mock("../models/users_model.js");

describe("Gestión de usuarios", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe("Listar usuarios", () => {
    it("debe devolver todos los usuarios", async () => {
      const fakeUsers = [{ username: "juan" }, { username: "maria" }];
      // simulamos User.find().select() retornando una promesa con fakeUsers
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUsers)
      });

      await getAllUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeUsers);
    });

    it("debe devolver mensaje si no hay usuarios", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getAllUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: "No hay usuarios registrados" });
    });

    it("debe manejar errores correctamente", async () => {
      User.find.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error("DB error"))
      }));

      await getAllUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        msg: "Error al listar todos los usuarios"
      }));
    });
  });

  describe("Listar un usuario", () => {
    it("debe devolver un usuario por username", async () => {
      const user = { username: "juan" };
      req.params = { username: "juan" };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      await getOneUserController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("debe manejar usuario no encontrado", async () => {
      req.params = { username: "noexiste" };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getOneUserController(req, res);

      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "No existe usuario con ese nombre de usuario" });
    });

    it("debe manejar errores correctamente", async () => {
      req.params = { username: "error" };

      User.findOne.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error("DB error"))
      }));

      await getOneUserController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        msg: "Error al listar un usuario"
      }));
    });
  });

  describe("Listar usuarios por rol", () => {
    it("debe devolver usuarios con un rol válido", async () => {
      const users = [{ username: "admin1", role: "administrador" }];
      req.params = { role: "administrador" };

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(users)
      });

      await getUsersByRoleController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });

    it("debe manejar rol inválido", async () => {
      req.params = { role: "superadmin" };

      await getUsersByRoleController(req, res);

      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "El rol ingresado es incorrecto" });
    });

    it("debe manejar caso sin usuarios encontrados", async () => {
      req.params = { role: "cliente" };

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getUsersByRoleController(req, res);

      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "No se encontraron usuarios con el rol cliente" });
    });

    it("debe manejar errores correctamente", async () => {
      req.params = { role: "cliente" };

      User.find.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error("DB error"))
      }));

      await getUsersByRoleController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        msg: "Error al listar usuarios por rol"
      }));
    });
  });
});

*/
jest.mock("../models/users_model.js");
jest.mock("bcrypt");
jest.mock("../config/nodemailer.js");

describe("Crear usuario", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        name: "Juan",
        lastname: "Perez",
        username: "juanperez",
        email: "juan@example.com",
        password: "Password123@",
        role: "entrenador"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("debe crear un usuario exitosamente", async () => {
    // Mock de las funciones necesarias
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword123");
    User.create.mockReturnValue({
      createToken: jest.fn().mockReturnValue("mockToken123"),
      save: jest.fn().mockResolvedValue(true)
    });

    await createUserController(req, res);

    // Verificaciones
    expect(User.findOne).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalledWith("Password123@", 10);
    expect(User.create).toHaveBeenCalledWith({
      name: "Juan",
      lastname: "Perez",
      username: "juanperez",
      email: "juan@example.com",
      password: "hashedPassword123",
      role: "entrenador"
    });
    expect(nodemailerMethods.sendMailToUser).toHaveBeenCalledWith(
      "juan@example.com",
      "mockToken123"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Usuario registrado correctamente"
    });
  });

  it("debe manejar error cuando el username ya existe", async () => {
    User.findOne.mockResolvedValueOnce({ username: "juanperez" });

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Username ya registrado"
    });
  });

  it("debe manejar error cuando el email ya existe", async () => {
    User.findOne
      .mockResolvedValueOnce(null) // Para username
      .mockResolvedValueOnce({ email: "juan@example.com" }); // Para email

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Email ya registrado"
    });
  });

  it("debe manejar error cuando el rol es inválido", async () => {
    req.body.role = "invalid_role";

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "El rol ingresado es incorrecto"
    });
  });

  it("debe manejar errores de validación", async () => {
    req.body.username = "ju"; // Menos de 3 caracteres

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Errores de validación",
      errores: expect.any(Array)
    });
  });

  it("debe manejar errores internos", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      succes: false,
      msg: "Error al intentar crear un usuario",
      error: "DB error"
    });
  });
});







describe("Actualizar usuario", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { username: "testuser" },
      body: { 
        name: "Nombre Correcto",  // Longitud 3-15 caracteres
        lastname: "Apellido Valido",  // Longitud 2-15 caracteres
        email: "test@example.com",  // Email válido
        //password: "ValidPass123@" Cumple requisitos de contraseña
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("actualiza usuario correctamente", async () => {
    // Mock para pasar todas las validaciones
    User.findOne.mockResolvedValue({ username: "testuser" });
    User.updateOne.mockResolvedValue({ matchedCount: 1 });
    bcrypt.hash.mockResolvedValue("hashedpass");

    await updateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Actualización realizada correctamente"
    });
  });

  it("maneja usuario no encontrado", async () => {
    // Datos válidos pero usuario no existe
    User.findOne.mockResolvedValue(null);

    await updateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "No existe usuario con ese username"
    });
  });

  it("maneja error de validación", async () => {
    // Provocamos error de validación con nombre muy corto
    req.body.name = "ab";

    await updateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].msg).toBe("Errores de validación");
  });

  it("maneja errores internos", async () => {
    // Configuramos datos válidos pero error en la DB
    User.findOne.mockRejectedValue(new Error("Error de DB"));

    await updateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].msg).toContain("Error al intentar actualizar");
  });
});





















describe("Eliminar un usuario", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { username: "usuario_a_eliminar" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("debe eliminar un usuario existente correctamente", async () => {
    // Configurar mocks
    const mockUser = { username: "usuario_a_eliminar" };
    User.findOne.mockResolvedValue(mockUser);
    User.findOneAndDelete.mockResolvedValue(mockUser);

    await deleteOneUserController(req, res);

    // Verificaciones
    expect(User.findOne).toHaveBeenCalledWith({ username: "usuario_a_eliminar" });
    expect(User.findOneAndDelete).toHaveBeenCalledWith({ username: "usuario_a_eliminar" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Usuario usuario_a_eliminar eliminado correctamente"
    });
  });

  it("debe manejar cuando el usuario no existe", async () => {
    User.findOne.mockResolvedValue(null);

    await deleteOneUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "No existe un usuario con ese username"
    });
    expect(User.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("debe manejar cuando no se puede eliminar el usuario", async () => {
    const mockUser = { username: "usuario_a_eliminar" };
    User.findOne.mockResolvedValue(mockUser);
    User.findOneAndDelete.mockResolvedValue(null);

    await deleteOneUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(203);
    expect(res.json).toHaveBeenCalledWith({
      msg: "No se pudo eliminar el usuario"
    });
  });

  it("debe manejar errores internos", async () => {
    User.findOne.mockRejectedValue(new Error("Error de base de datos"));

    await deleteOneUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      succes: false,
      msg: "Error al intentar eliminar un usuario",
      error: "Error de base de datos"
    });
  });
});