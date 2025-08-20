import Progress from "../models/progresos_model.js";
import User from "../models/users_model.js"

import { check, validationResult } from "express-validator";
import mongoose from "mongoose";

const createOneProgressController = async (req, res) => {
    const idUser = req.user._id;

    try {
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe ingresar todos los valores especificados"});
        if (!mongoose.isValidObjectId(idUser)) return res.status(203).json({msg: "Id inválido"});
        const objectId = new mongoose.Types.ObjectId(idUser);

        await check("dateStart")
            .exists()
            .withMessage("Debe enviar la fecha de inicio")
            .isDate()
            .trim()
            .withMessage("Debe ser una fecha")
            .run(req)

        await check("dateEnd")
            .exists()
            .withMessage("Debe enviar la fecha fin")
            .isDate()
            .trim()
            .withMessage("Debe ser una fecha")
            .run(req)

        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                msg: 'Errores de validación',
                errores: errores.array()
            });
        };

        if (req.body.details)
        {
            for (const [index, datos] of req.body.details.entries())
            {
                await check(`details[${index}].name`)
                    .optional()
                    .isString()
                    .trim()
                    .isLength({min: 3, max: 15})
                    .withMessage("Los nombres de cada medición deben tener entre 3 y 15 dígitos")
                    .run(req)
                
                await check(`details[${index}].measure`)
                    .optional()
                    .isFloat({min:0.1})
                    .trim()
                    .withMessage("Las mediciones deben ser números mayores que 0.1")
                    .run(req)

                await check(`exercises[${index}].unity`)
                    .optional()
                    .trim()
                    .isString()
                    .withMessage("La unidad de medida debe ser un string")
                    .run(req)
            }
            const erroresDetails = validationResult(req);
            if (!erroresDetails.isEmpty()) {
                return res.status(400).json({
                    msg: "Errores de validación",
                    errores: erroresDetails.array()
                });
            }
        }
        
        const progress = new Progress({ ...req.body });
        progress.idUser = objectId;
        const x = await progress.save();
        if (!x) return res.status(203).json({msg: "No se pudo guardar el progreso creado"})
        return res.status(201).json(x);
    } catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar crear un progreso",
            error: error.message
        });
    }
};






const listarProgresosUsuarioControllerEntrenador = async (req, res) => {
    const {username} = req.params;

    try {
        const userBd = await User.findOne({username});
        if (!userBd) return res.status(203).json({ msg: "No existe usuario con el username proporcionado" })
        const progresses = await Progress.find({idUser: userBd._id});
        if (!progresses) return res.status(404).json({ message: `No hay progresos registrados para el usuario ${username}` });
        return res.status(200).json(progresses);
    } catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error al listar los progresos de un usuario",
            error: error.message
        });
    }
};
//Listar progresos para Clientes
const listarProgresosUsuarioController = async (req, res) => {
    const {username} = req.params;

    try {
        const userBd = await User.findOne({username});
        if (!userBd) return res.status(203).json({ msg: "No existe usuario con el username proporcionado" })
        if (!userBd._id.equals(req.user._id)) return res.status(203).json({ msg: "No puede listar las rutinas de otro usuario" });
        const progresses = await Progress.find({idUser: userBd._id});
        if (!progresses) return res.status(404).json({ message: `No hay progresos registrados para el usuario ${username}` });
        return res.status(200).json(progresses);
    } catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error al listar los progresos de un usuario",
            error: error.message
        });
    }
};





const updateOneProgressController = async (req, res) => {
    try {
        const { _id } = req.params;
        const data = req.body;

        delete data.idUser;
        delete data.createdAt;
        delete data.updatedAt;
        delete data.__v;
        
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe ingresar todos los valores especificados"});
        if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Id inválido"});
        const objectId = new mongoose.Types.ObjectId(_id);
        
        await check("dateStart")
            .optional()
            .trim()
            .isDate()
            .withMessage("Debe ser una fecha")
            .run(req)

        await check("dateEnd")
            .optional()
            .trim()
            .isDate()
            .withMessage("Debe ser una fecha")
            .run(req)

        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                msg: 'Errores de validación',
                errores: errores.array()
            });
        };

        if (data.details) {
            for (const [index, dato] of data.details.entries())
            {
                await check(`details[${index}].name`)
                    .optional()
                    .trim()
                    .isString()
                    .withMessage("El nombre debe ser string")
                    .isLength({min: 3, max: 15})
                    .withMessage("El nombre debe tener entre 3 y 15 dígitos")
                    .run(req)

                await check(`details[${index}].measure`)
                    .optional()
                    .isFloat({gt:0})
                    .trim()
                    .withMessage("La medición debe ser positivo")
                    .run(req)

                await check(`exercises[${index}].unity`)
                    .optional()
                    .trim()
                    .isString()
                    .withMessage("La unidad de medida debe ser un string")
                    .run(req)
            };
            const erroresDetails = validationResult(req);

            if (!erroresDetails.isEmpty()) {
                return res.status(400).json({
                    msg: 'Errores de validación',
                    errores: erroresDetails.array()
                });
            };
        };

        const progress = await Progress.updateOne({_id: objectId}, {$set: data});
        if (!progress) return res.status(404).json({ message: "No se pudo actualizar el progreso" });
        return res.status(200).json(progress);
    } catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar actualizar un progreso",
            error: error.message
        });
    }
};

const deleteOneProgressController = async (req, res) => {
    const { _id } = req.params
    try {
        if(!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Id inválido"});
        const objectId = new mongoose.Types.ObjectId(_id);
        const progress = await Progress.findOneAndDelete({_id: objectId});
        if (!progress) return res.status(404).json({ msg: "El progreso no se pudo eliminar" });
        return res.status(200).json({ msg: "Se eliminó el progreso exitosamente" });
    } catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar eliminar un progreso",
            error: error.message
        });
    }
};

export {
    createOneProgressController,

    listarProgresosUsuarioControllerEntrenador,
    listarProgresosUsuarioController,
    
    updateOneProgressController,
    deleteOneProgressController
}
