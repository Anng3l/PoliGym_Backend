//Con las validaciones de las HU



import mongoose from "mongoose";
import Asistencia from "../models/asistencia_model.js";
import User from "../models/users_model.js"
import { check, validationResult } from "express-validator";


// Función crear asistencia Entrenador
export const crearAsistenciaControllerEntrenador = async (req, res) => {
  try {
    const { idUser } = req.body;
    if (!idUser) return res.status(400).json({ msg: "El id del usuario es requerido." });
    if (Object.values(req.body.idUser).includes("")) return res.status(203).json({msg: "Debe enviar valores en todos los campos"});
    
    if (!mongoose.isValidObjectId(idUser)) return res.status(203).json({msg: "Id de usuario incorrecta"});
    const idObject = new mongoose.Types.ObjectId(idUser);

    await check("checkInTime")
          .exists().withMessage("La fehcha de ingreso es obligatoria")
          .isISO8601().withMessage("Debe ser una fecha (yyyy-mm-dd'T'hh:mm:ssZ)")
          .toDate()
          .run(req);
          

    const errores = validationResult(req);

    if (!errores.isEmpty())
    {
      return res.status(400).json({
        msg: 'Errores de validación',
        errores: errores.array()
      });
    }
    

    const inputDate = new Date(req.body.checkInTime);
    const today = new Date();
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (inputDate > today)
    {
      return res.status(400).json({
        msg: "La fecha no puede ser posterior a hoy"
      })
    }
    

    const fechaEntrada = new Date(req.body.checkInTime);

    const nuevaAsistencia = new Asistencia({ ...req.body });

    const asistenciaGuardada = await nuevaAsistencia.save();
    if (!asistenciaGuardada) return res.status(203).json({ msg: "La asistencia no pudo ser guardada en la BD" })
    
    return res.status(201).json({
      message: "Asistencia creada exitosamente",
      data: asistenciaGuardada,
    });
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar crear una asistencia",
      error: error.message
    });
  }
};

// Función crear Asistencia
export const crearAsistenciaController = async (req, res) => {
  try {
    if (Object.values(req.user._id).includes("")) return res.status(203).json({msg: "Debe enviar valores en todos los campos"});
    
    if (!mongoose.isValidObjectId(req.user._id)) return res.status(203).json({msg: "Id de usuario incorrecta"});
    const idObject = new mongoose.Types.ObjectId(req.user._id);

    await check("checkInTime")
          .exists().withMessage("La fehcha de ingreso es obligatoria")
          .isISO8601().withMessage("Debe ser una fecha (yyyy-mm-dd'T'hh:mm:ssZ)")
          .toDate()
          .run(req);
          
    const errores = validationResult(req);

    if (!errores.isEmpty())
    {
      return res.status(400).json({
        msg: 'Errores de validación',
        errores: errores.array()
      });
    }


    const inputDate = new Date(req.body.checkInTime);
    const today = new Date();
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (inputDate !== today)
    {
      return res.status(400).json({
        msg: "La fecha no puede ser posterior, ni anterior, a hoy"
      })
    }

    const nuevaAsistencia = new Asistencia({ ...req.body });
    nuevaAsistencia.idUser = idObject;
    const asistenciaGuardada = await nuevaAsistencia.save();
    if (!asistenciaGuardada) return res.status(203).json({ msg: "La asistencia no pudo ser guardada en la BD" })
    
    return res.status(201).json({
      message: "Asistencia creada exitosamente",
      data: asistenciaGuardada,
    });
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar crear una asistencia",
      error: error.message
    });
  }
};



// Obtener todas las asistencias ------------------------------------------------------------------------------------------------------------
export const obtenerAsistenciasController = async (req, res) => {
  try {
    const _id = req.user._id;

    if (!_id) return res.status(203).json({msg: "Debe enviar el id del usuario"});
    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "Id de usuario incorrecta"});
    
    const idObject = new mongoose.Types.ObjectId(_id);

    const asistencias = await Asistencia.find({idUser: idObject});
    if (!asistencias) return res.status(203).json({ msg: "No existen asistencias guardadas" });

    return res.status(200).json({ asistencias });
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar leer todas las asistencias",
      error: error.message
    });
  }
};






//Actualizar Asistencia
export const actualizarAsistenciaController = async (req, res) => {
  try {
    const { _id } = req.params;

    delete req.body.idUser;
    delete req.body._id;
    delete req.body.__v;

    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({ msg: "Id inválida" });
    const idObject = new mongoose.Types.ObjectId(_id);

    await check("checkInTime")
          .optional()
          .isISO8601().withMessage("Debe ser una fecha (yyyy-mm-dd'T'hh:mm:ssZ)")
          .toDate()
          .run(req);

    const errores = validationResult(req);

    if (!errores.isEmpty())
    {
      return res.status(400).json({
        msg: 'Errores de validación',
        errores: errores.array()
      });
    };


    let fechaAhora = Date.now();
    let conversion = req.body.checkInTime; 
    if (fechaAhora < conversion) return res.status(203).json({ msg: "La fecha no puede ser futura" });
  


    const asistenciaActualizada = await Asistencia.findByIdAndUpdate(
      {_id: idObject},
      req.body,
      { new: true }
    );

    if (!asistenciaActualizada) return res.status(404).json({ msg: "No se pudo actualizar la asistencia" });

    return res.status(200).json({
      msg: "Asistencia actualizada exitosamente"
    });
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar actualizar una asistencia",
      error: error.message
    });
  }
};

export const eliminarAsistenciaController = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) return res.status(203).json({ msg: "Id inválida" });
    const idObject = new mongoose.Types.ObjectId(id);

    const asistenciaEliminada = await Asistencia.findByIdAndDelete({_id: idObject});
  
    if (!asistenciaEliminada) return res.status(404).json({ message: "La asistencia no se pudo eliminar" });

    return res.status(200).json({
        message: "Asistencia eliminada exitosamente"
    });
  } catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar actualizar una asistencia",
      error: error.message
    });
  }
};


export const obtenerAsistenciasPorUserController = async (req, res) => {
  const { username } = req.params;

  try {
    const userBD = await User.findOne({username});

    const asistencias = await Asistencia.find({ idUser : userBD._id });

    if (asistencias.length > 0) {
      return res.status(200).json({
        message: "Asistencias obtenidas exitosamente",
        asistencias
      });
    } else {
      return res.status(404).json({
        message: "No se encontraron asistencias para ese usuario"
      });
    }
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar buscar asistencias por usuario",
      error: error.message
    });
  }
};
