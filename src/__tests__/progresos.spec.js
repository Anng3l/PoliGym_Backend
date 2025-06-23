import {
  createOneProgressController,
  listarProgresosUsuarioController,
  listarProgresosUsuarioControllerEntrenador,
  updateOneProgressController,
  deleteOneProgressController
} from "../controllers/progress_controller.js";

import Progress from "../models/progresos_model.js";
import User from "../models/users_model.js";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

// Mocks
jest.mock("../models/progresos_model.js");
jest.mock("../models/users_model.js");
jest.mock("express-validator", () => ({
  ...jest.requireActual("express-validator"),
  validationResult: jest.fn()
}));

describe("Crear progreso", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        dateStart: "2024-01-01",
        dateEnd: "2024-02-01",
        details: [{ name: "Peso", measure: 70 }]
      },
      user: { _id: new mongoose.Types.ObjectId().toString() }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  it("debe guardar el progreso y devolver 201", async () => {
    const mockSavedProgress = { _id: "123", ...req.body };
    Progress.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockSavedProgress)
    }));

    await createOneProgressController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockSavedProgress);
  });

  it("debe devolver 203 si hay campos vacíos", async () => {
    req.body.dateStart = "";
    await createOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("debe devolver 500 si ocurre un error", async () => {
    Progress.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("fallo inesperado"))
    }));

    await createOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("Listar progresos por usuario", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { username: "user123" },
      user: { _id: new mongoose.Types.ObjectId() }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it("retorna 203 si no se encuentra el usuario", async () => {
    User.findOne.mockResolvedValue(null);
    await listarProgresosUsuarioController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 203 si otro usuario intenta acceder", async () => {
    const otherUser = { _id: new mongoose.Types.ObjectId() };
    User.findOne.mockResolvedValue(otherUser);
    await listarProgresosUsuarioController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 200 con progresos", async () => {
    User.findOne.mockResolvedValue(req.user);
    const progresses = [{ id: "a" }, { id: "b" }];
    Progress.find.mockResolvedValue(progresses);
    await listarProgresosUsuarioController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(progresses);
  });

  it("retorna 500 si hay error", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));
    await listarProgresosUsuarioController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("Listar progresos por usuario - Entrenador", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { username: "trainer123" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it("retorna 203 si no se encuentra el usuario", async () => {
    User.findOne.mockResolvedValue(null);
    await listarProgresosUsuarioControllerEntrenador(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 404 si no hay progresos", async () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    User.findOne.mockResolvedValue(user);
    Progress.find.mockResolvedValue(null);
    await listarProgresosUsuarioControllerEntrenador(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("retorna 200 con progresos", async () => {
    const user = { _id: new mongoose.Types.ObjectId() };
    User.findOne.mockResolvedValue(user);
    Progress.find.mockResolvedValue([{ id: 1 }]);
    await listarProgresosUsuarioControllerEntrenador(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("Actualizar progreso", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { _id: new mongoose.Types.ObjectId().toString() },
      body: {
        dateStart: "2024-01-01",
        dateEnd: "2024-02-01",
        details: [{ name: "Cintura", measure: 50 }]
      }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  it("retorna 203 si campos vacíos", async () => {
    req.body.dateStart = "";
    await updateOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 203 si ID no válido", async () => {
    req.params._id = "invalido";
    await updateOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 404 si no se actualiza", async () => {
    Progress.updateOne.mockResolvedValue(null);
    await updateOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("retorna 200 si se actualiza correctamente", async () => {
    Progress.updateOne.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
    await updateOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("retorna 500 si hay error", async () => {
    Progress.updateOne.mockRejectedValue(new Error("update failed"));
    await updateOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("Eliminar progreso", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { _id: new mongoose.Types.ObjectId().toString() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it("retorna 203 si el ID no es válido", async () => {
    req.params._id = "malformado";
    await deleteOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(203);
  });

  it("retorna 404 si no se encuentra progreso a eliminar", async () => {
    Progress.findOneAndDelete.mockResolvedValue(null);
    await deleteOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("retorna 200 si se elimina correctamente", async () => {
    Progress.findOneAndDelete.mockResolvedValue({ _id: req.params._id });
    await deleteOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("retorna 500 si hay error", async () => {
    Progress.findOneAndDelete.mockRejectedValue(new Error("fallo eliminación"));
    await deleteOneProgressController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
