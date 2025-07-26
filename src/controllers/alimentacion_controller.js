import mongoose from "mongoose";
import Alimentacion from "../models/alimentacion_model.js";
import { check, validationResult } from "express-validator";
import users_model from "../models/users_model.js";


const createAlimentacionController = async (req, res) => {
    const datos = req.body;

    //Campos del registro
    const name = datos.name;
    const informacion = datos.information;
    
    const idUserAlimentacion = datos.userId;

    try
    {
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe enviar todos los datos"});
        if (!name) return res.status(203).json({msg: "Debe ingresar el nombre de la alimentación"});
        if (!informacion) return res.status(203).json({msg: "Debe ingresar una descripción de la alimentación"});

        if (!mongoose.isValidObjectId(idUserAlimentacion)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const objectId = new mongoose.Types.ObjectId(idUserAlimentacion);

        const usuario = await users_model.findById(objectId);
        
        if (usuario.role !== "cliente")
        {
            return res.status(203).json({ msg: "El usuario no es un cliente" });
        }

        await check("name")
            .isString()
            .trim()
            .isLength({ min: 5, max: 40 })
            .withMessage("El nombre debe tener entre 5 y 40 dígitos")
            .run(req);
        
        await check("information")
            .isString()
            .trim()
            .isLength({max:1000})
            .withMessage("La descripción debe tener contenido. Máximo 1000 dígitos.")
            .run(req);
    
        const errores = validationResult(req);
            
        if (!errores.isEmpty()) {
            return res.status(400).json({
            msg: "Errores en la validación de campos",
            errores: errores.array()
            });
        };


        const alimentacion = new Alimentacion({ ...datos });
        alimentacion.idUser = objectId;
        await alimentacion.save();

        return res.status(200).json({ msg: "Alimentación creada exitosamente", alimentacion });
    }
    catch(e) {
        return res.status(203).json({ msg: "Error al crear una información de alimentación", error: e.message });
    }
}



const updateAlimentacionController = async (req, res) => {
    //_id de la rutina
    const { _id } = req.params;
    const datos = req.body;

    //const idUserAlimentacion = datos.userId;
    
    try
    {
        /*
        if (!mongoose.isValidObjectId(idUserAlimentacion)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const objectId = new mongoose.Types.ObjectId(idUserAlimentacion);
        */
        if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const alimentacionId = new mongoose.Types.ObjectId(_id);

        await check("name")
            .optional()
            .isString()
            .trim()
            .isLength({ min: 5, max: 40 })
            .withMessage("El nombre debe tener entre 5 y 20 dígitos")
            .matches(/^[A-Za-z0-9 ]+$/)
            .withMessage("El nombre sólo puede contener letras y números")
            .run(req);
        
        await check("description")
            .optional()
            .isString()
            .trim()
            .isLength({max:400})
            .withMessage("La descripción debe tener contenido. Máximo 400 dígitos.")
            .run(req);
    
        const errores = validationResult(req);
            
        if (!errores.isEmpty()) {
            return res.status(400).json({
            msg: "Errores en la validación de campos",
            errores: errores.array()
            });
        };


        const alimentacionActualizada = await Alimentacion.findByIdAndUpdate(alimentacionId, { ...datos }, {new: true});

        if (!alimentacionActualizada) return res.status(203).json({ msg: "Error al actualizar un registro de alimentación" });

        return res.status(200).json({ msg: "Alimentación actualizada exitosamente", alimentacionActualizada });
    }
    catch(e) {
        return res.status(203).json({ msg: "Error al actualizar una información de alimentación", error: e.message });
    }
}



const getAllAlimentacionControllerEntrenador = async (req, res) => {
    
    const { _id } = req.params;

    try
    {
        if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const objectId = new mongoose.Types.ObjectId(_id);

        const alimentaciones = await Alimentacion.find({ idUser: objectId });

        if (alimentaciones.length < 0) return res.status(200).json({ msg: "El usuario no posee registros de alimentación" });

        return res.status(200).json({Alimentaciones: alimentaciones});
    }
    catch(e) {
        return res.status(203).json({ msg: "Error al listar todas las informaciones de alimentación por parte del entrenador", error: e.message });
    }
}

const getAllAlimentacionController = async (req, res) => {
    
    const userId = req.user._id;

    try
    {
        if (!mongoose.isValidObjectId(userId)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const objectId = new mongoose.Types.ObjectId(userId);

        const alimentaciones = await Alimentacion.find({ idUser: objectId });
        
        if (alimentaciones.length <= 0) return res.status(200).json({ msg: "El usuario no posee registros de alimentación" });

        return res.status(200).json({Alimentaciones: alimentaciones});
    }
    catch(e) {
        return res.status(203).json({ msg: "Error al listar todas las informaciones de alimentación", error: e.message });
    }
}



const deleteAlimentacionController = async (req, res) => {
    
    //_id de la alimentación
    const { _id } = req.params;

    //const idUserAlimentacion = datos.userId;
    
    try
    {
        if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
        const alimentacionId = new mongoose.Types.ObjectId(_id);

        await Alimentacion.findByIdAndDelete({_id: alimentacionId});

        return res.status(200).json({msg: "Alimentación eliminada exitosamente"});

    }
    catch(e) {
        return res.status(203).json({ msg: "Error al eliminar una información de alimentación", error: e.message });
    }
}





export {
    createAlimentacionController,
    updateAlimentacionController,
    getAllAlimentacionControllerEntrenador,
    
    
    getAllAlimentacionController,


    deleteAlimentacionController
    
}