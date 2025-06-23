import {
  crearAsistenciaControllerEntrenador,
  crearAsistenciaController,
  obtenerAsistenciasController,
  actualizarAsistenciaController,
  eliminarAsistenciaController,
  obtenerAsistenciasPorUserController,
} from "../controllers/asistencias_controller.js";

import mongoose from "mongoose";
import { validationResult } from "express-validator";

// Mock de Asistencia con métodos y save accesibles
jest.mock("../models/asistencia_model.js", () => {
  const save = jest.fn();
  const find = jest.fn();
  const findByIdAndUpdate = jest.fn();
  const findByIdAndDelete = jest.fn();

  const Asistencia = jest.fn(() => ({
    save,
  }));

  Asistencia.find = find;
  Asistencia.findByIdAndUpdate = findByIdAndUpdate;
  Asistencia.findByIdAndDelete = findByIdAndDelete;

  // Exponer los mocks para manipular en tests
  Asistencia.__save = save;
  Asistencia.__find = find;
  Asistencia.__findByIdAndUpdate = findByIdAndUpdate;
  Asistencia.__findByIdAndDelete = findByIdAndDelete;

  return Asistencia;
});

// Mock de User con findOne
jest.mock("../models/users_model.js", () => {
  const findOne = jest.fn();
  return { findOne };
});

jest.mock("express-validator", () => ({
  check: jest.fn(() => ({
    exists: () => ({
      withMessage: () => ({
        isISO8601: () => ({
          withMessage: () => ({
            toDate: () => ({
              run: jest.fn(),
            }),
          }),
        }),
      }),
    }),
    optional: () => ({
      isISO8601: () => ({
        withMessage: () => ({
          toDate: () => ({
            run: jest.fn(),
          }),
        }),
      }),
    }),
  })),
  validationResult: jest.fn(),
}));

jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return {
    ...actual,
    isValidObjectId: jest.fn(),
    Types: {
      ObjectId: jest.fn((id) => id),
    },
  };
});

import Asistencia from "../models/asistencia_model.js";
import User from "../models/users_model.js";

describe("Crear asistencia - Entrenador", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        idUser: "685034fd56250ccbb1e3abce",
        checkInTime: new Date().toISOString(),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mongoose.isValidObjectId.mockReturnValue(true);
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    Asistencia.mockClear();
    Asistencia.__save.mockClear();

    Asistencia.mockImplementation(() => ({
      save: Asistencia.__save,
    }));
    Asistencia.__save.mockResolvedValue({ _id: "685034fd56250ccbb1e3abce", ...req.body });
  });

  it("debería crear una asistencia y devolver 201", async () => {
    await crearAsistenciaControllerEntrenador(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Asistencia creada exitosamente",
      data: expect.objectContaining({ idUser: req.body.idUser }),
    });
  });
});

describe("Crear asistencia", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: "1234567890abcdef12345678" },
      body: { checkInTime: new Date().toISOString() },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mongoose.isValidObjectId.mockReturnValue(true);
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    Asistencia.mockClear();
    Asistencia.__save.mockClear();

    Asistencia.mockImplementation(() => ({
      save: Asistencia.__save,
    }));
    Asistencia.__save.mockResolvedValue({ _id: req.user._id, ...req.body });
  });

  it("debe devolver 201 cuando la asistencia se crea correctamente", async () => {
    await crearAsistenciaController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Asistencia creada exitosamente",
      data: expect.any(Object),
    });
  });
});

describe("Listar asistencias", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "1234567890abcdef12345678" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mongoose.isValidObjectId.mockReturnValue(true);

    Asistencia.__find.mockClear();
    Asistencia.__find.mockResolvedValue([{ idUser: req.user._id }]);
  });

  it("debe devolver 200 con asistencias", async () => {
    await obtenerAsistenciasController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ asistencias: expect.any(Array) });
  });
});

describe("Actualizar asistencia", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { _id: "1234567890abcdef12345678" },
      body: { checkInTime: new Date().toISOString() },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mongoose.isValidObjectId.mockReturnValue(true);
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    Asistencia.__findByIdAndUpdate.mockClear();
    Asistencia.__findByIdAndUpdate.mockResolvedValue({
      _id: req.params._id,
      checkInTime: req.body.checkInTime,
    });
  });

  it("debe actualizar asistencia y devolver 200", async () => {
    await actualizarAsistenciaController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Asistencia actualizada exitosamente",
    });
  });
});

describe("Eliminar asistencia", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { id: "1234567890abcdef12345678" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    mongoose.isValidObjectId.mockReturnValue(true);

    Asistencia.__findByIdAndDelete.mockClear();
    Asistencia.__findByIdAndDelete.mockResolvedValue({ _id: req.params.id });
  });

  it("debe eliminar asistencia y devolver 200", async () => {
    await eliminarAsistenciaController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Asistencia eliminada exitosamente",
    });
  });
});

describe("Obtener asistencias por usuario", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { username: "testuser" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    User.findOne.mockClear();
    Asistencia.__find.mockClear();

    User.findOne.mockResolvedValue({ _id: "1234567890abcdef12345678" });
    Asistencia.__find.mockResolvedValue([{ idUser: "1234567890abcdef12345678" }]);
  });

  it("debe obtener asistencias por usuario y devolver 200", async () => {
    await obtenerAsistenciasPorUserController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Asistencias obtenidas exitosamente",
      asistencias: expect.any(Array),
    });
  });
});
