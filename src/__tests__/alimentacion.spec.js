// src/__tests__/alimentacion.spec.js

import mongoose from "mongoose";
import * as controllers from "../controllers/alimentacion_controller.js";
import Alimentacion from "../models/alimentacion_model.js";
import users_model from "../models/users_model.js";
import { validationResult } from "express-validator";

// --- Mocks ---

// Mock mongoose
jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return {
    ...actual,
    isValidObjectId: jest.fn(),
    Types: { ObjectId: jest.fn((id) => id) },
  };
});

// Mock express-validator
jest.mock("express-validator", () => {
  const chain = {
    exists: () => chain,
    isString: () => chain,
    trim: () => chain,
    isLength: () => chain,
    withMessage: () => chain,
    matches: () => chain,
    optional: () => chain,
    run: jest.fn().mockResolvedValue(undefined),
  };
  return {
    check: jest.fn(() => chain),
    validationResult: jest.fn(() => ({ isEmpty: () => true, array: () => [] })),
  };
});

// Mock Alimentacion model
jest.mock("../models/alimentacion_model.js", () => {
  const saveMock = jest.fn();
  const findMock = jest.fn();
  const findByIdAndUpdateMock = jest.fn();
  const findByIdAndDeleteMock = jest.fn();

  function Mock(data) { return { save: saveMock }; }
  Mock.find = findMock;
  Mock.findByIdAndUpdate = findByIdAndUpdateMock;
  Mock.findByIdAndDelete = findByIdAndDeleteMock;

  Mock.__save = saveMock;
  Mock.__find = findMock;
  Mock.__findByIdAndUpdate = findByIdAndUpdateMock;
  Mock.__findByIdAndDelete = findByIdAndDeleteMock;

  return Mock;
});

// Mock users_model
jest.mock("../models/users_model.js", () => {
  const findByIdMock = jest.fn();
  return { findById: findByIdMock, __findById: findByIdMock };
});

import AlimentacionMock from "../models/alimentacion_model.js";
import UsersMock from "../models/users_model.js";

// Tests

describe("Controladores de Alimentacion", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.isValidObjectId.mockReturnValue(true);
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    req = { body: {}, params: {}, user: { _id: "507f1f77bcf86cd799439011" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe("Crear alimentación", () => {
    it("debe fallar si falta un dato", async () => {
      req.body = { name: "", information: "", userId: "" };
      await controllers.createAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Debe enviar todos los datos" });
    });

    it("debe fallar si usuario no es cliente", async () => {
      req.body = { name: "Test", information: "Desc", userId: "id" };
      UsersMock.__findById.mockResolvedValue({ role: "entrenador" });
      await controllers.createAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "El usuario no es un cliente" });
    });

    it("debe crear correctamente", async () => {
      req.body = { name: "Test", information: "Desc", userId: "id" };
      UsersMock.__findById.mockResolvedValue({ role: "cliente" });
      AlimentacionMock.__save.mockResolvedValue({ _id: "1", ...req.body });

      await controllers.createAlimentacionController(req, res);

      expect(AlimentacionMock.__save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: "Alimentación creada exitosamente",
          alimentacion: expect.any(Object),
        })
      );
    });

    it("debe capturar excepción en creación", async () => {
      req.body = { name: "X", information: "Y", userId: "id" };
      UsersMock.__findById.mockRejectedValue(new Error("boom"));
      await controllers.createAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({
        msg: "Error al crear una información de alimentación",
        error: "boom",
      });
    });
  });

  describe("Actualizar alimentación", () => {
    it("debe fallar si _id inválido", async () => {
      req.params._id = "invalido";
      mongoose.isValidObjectId.mockReturnValue(false);
      await controllers.updateAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Debe ingresar un id de usuario correcto" });
    });

    it("debe actualizar correctamente", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      req.body = { name: "Nuevo" };
      AlimentacionMock.__findByIdAndUpdate.mockResolvedValue({ name: "Nuevo" });

      await controllers.updateAlimentacionController(req, res);

      const oid = new mongoose.Types.ObjectId(req.params._id);
      expect(AlimentacionMock.__findByIdAndUpdate).toHaveBeenCalledWith(
        oid,
        req.body,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: "Alimentación actualizada exitosamente",
          alimentacionActualizada: expect.any(Object),
        })
      );
    });

    it("debe retornar 203 si no encuentra para actualizar", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      AlimentacionMock.__findByIdAndUpdate.mockResolvedValue(null);

      await controllers.updateAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Error al actualizar un registro de alimentación" });
    });

    it("debe capturar excepción en update", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      AlimentacionMock.__findByIdAndUpdate.mockRejectedValue(new Error("fail"));
      await controllers.updateAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({
        msg: "Error al actualizar una información de alimentación",
        error: "fail",
      });
    });
  });

  describe("Listar toda la informacion de alimentacion - Entrenador", () => {
    it("debe fallar si _id inválido", async () => {
      req.params._id = "invalido";
      mongoose.isValidObjectId.mockReturnValue(false);
      await controllers.getAllAlimentacionControllerEntrenador(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Debe ingresar un id de usuario correcto" });
    });

    it("debe listar correctamente", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockResolvedValue([{ name: "A1" }]);
      await controllers.getAllAlimentacionControllerEntrenador(req, res);
      const oid = new mongoose.Types.ObjectId(req.params._id);
      expect(AlimentacionMock.__find).toHaveBeenCalledWith({ idUser: oid });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ Alimentaciones: expect.any(Array) });
    });

    it("debe retornar array vacío si no hay registros", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockResolvedValue([]);
      await controllers.getAllAlimentacionControllerEntrenador(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ Alimentaciones: [] });
    });

    it("debe capturar excepción en listar entrenador", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockRejectedValue(new Error("oops"));
      await controllers.getAllAlimentacionControllerEntrenador(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({
        msg: "Error al listar todas las informaciones de alimentación por parte del entrenador",
        error: "oops",
      });
    });
  });

  describe("Lista toda la informacion de alimentacion", () => {
    it("debe fallar si userId inválido", async () => {
      req.user._id = "invalido";
      mongoose.isValidObjectId.mockReturnValue(false);
      await controllers.getAllAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Debe ingresar un id de usuario correcto" });
    });

    it("debe listar correctamente para cliente", async () => {
      req.user._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockResolvedValue([{ name: "B1" }]);
      await controllers.getAllAlimentacionController(req, res);
      const oid = new mongoose.Types.ObjectId(req.user._id);
      expect(AlimentacionMock.__find).toHaveBeenCalledWith({ idUser: oid });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ Alimentaciones: expect.any(Array) });
    });

    it("debe retornar mensaje si no hay registros cliente", async () => {
      req.user._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockResolvedValue([]);
      await controllers.getAllAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: "El usuario no posee registros de alimentación" });
    });

    it("debe capturar excepción en listar cliente", async () => {
      req.user._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__find.mockRejectedValue(new Error("err"));
      await controllers.getAllAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({
        msg: "Error al listar todas las informaciones de alimentación",
        error: "err",
      });
    });
  });

  describe("Eliminar informacion de alimentacion", () => {
    it("debe fallar si _id inválido en delete", async () => {
      req.params._id = "invalido";
      mongoose.isValidObjectId.mockReturnValue(false);
      await controllers.deleteAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({ msg: "Debe ingresar un id de usuario correcto" });
    });

    it("debe eliminar correctamente", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__findByIdAndDelete.mockResolvedValue({});
      await controllers.deleteAlimentacionController(req, res);
      const oid = new mongoose.Types.ObjectId(req.params._id);
      expect(AlimentacionMock.__findByIdAndDelete).toHaveBeenCalledWith({ _id: oid });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: "Alimentación eliminada exitosamente" });
    });

    it("debe capturar excepción en delete", async () => {
      req.params._id = "507f1f77bcf86cd799439011";
      mongoose.isValidObjectId.mockReturnValue(true);
      AlimentacionMock.__findByIdAndDelete.mockRejectedValue(new Error("delerr"));
      await controllers.deleteAlimentacionController(req, res);
      expect(res.status).toHaveBeenCalledWith(203);
      expect(res.json).toHaveBeenCalledWith({
        msg: "Error al eliminar una información de alimentación",
        error: "delerr",
      });
    });
  });
});