import { updateRoutineEntrenador, updateRoutine } from "../../controllers/routines_controller.js";
import Routine from "../../models/routines_model.js";
import mongoose from "mongoose";

jest.mock("express-validator", () => {
  const runMock = jest.fn(); // Simula validaciones exitosas
  return {
    check: jest.fn(() => ({
      optional: () => ({
        trim: () => ({
          isString: () => ({
            isLength: () => ({
              withMessage: () => ({ run: runMock })
            }),
            withMessage: () => ({ run: runMock })
          }),
          isInt: () => ({
            withMessage: () => ({ run: runMock })
          }),
          isFloat: () => ({
            withMessage: () => ({ run: runMock })
          })
        })
      })
    })),
    validationResult: jest.fn(() => ({
      isEmpty: () => true,
      array: () => []
    }))
  };
});


// Mock de mongoose.isValidObjectId
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    isValidObjectId: jest.fn(() => true),
    Types: {
      ObjectId: jest.fn((id) => id)
    }
  };
});

describe("Actualizar una rutina", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("updateRoutineEntrenador - debería actualizar una rutina exitosamente", async () => {
    const req = {
      params: { _id: "123456789012345678901234" },
      body: {
        name: "Rutina nueva",
        description: "Rutina actualizada",
        exercises: [
          { name: "Flexiones", series: 3, repetitions: 12, measure: "unidades" }
        ]
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mocks de Mongoose
    const mockRutina = { _id: req.params._id };
    Routine.findOne = jest.fn().mockResolvedValue(mockRutina);
    Routine.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: req.params._id,
      ...req.body
    });

    await updateRoutineEntrenador(req, res);

    expect(Routine.findOne).toHaveBeenCalledWith({ _id: expect.anything() });
    expect(Routine.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Rutina nueva",
        description: "Rutina actualizada",
        exercises: expect.any(Array)
      }),
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "La rutina ha sido actualizada satisfactoriamente",
      updatedRoutine: {
        _id: req.params._id,
        ...req.body
      }
    });
  });

  test("updateRoutine - debería actualizar la rutina del usuario autenticado", async () => {
    const req = {
      params: { _id: "123456789012345678901234" },
      body: {
        name: "Rutina cliente",
        description: "Rutina del cliente actualizada",
        exercises: [
          { name: "Sentadillas", series: 4, repetitions: 15, measure: "unidades" }
        ]
      },
      user: { _id: "123456789012345678901234" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Routine.findOne = jest.fn().mockResolvedValue({
      _id: req.params._id,
      idUserRutina: {
        equals: (id) => id === req.user._id
      }
    });

    Routine.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: req.params._id,
      ...req.body
    });

    await updateRoutine(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: "La rutina ha sido actualizada satisfactoriamente",
      updatedRoutine: {
        _id: req.params._id,
        ...req.body
      }
    });
  });

});
