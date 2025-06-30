import mongoose from "mongoose";
import Routine from "../models/routines_model.js";
import User from "../models/users_model.js";

import { check, validationResult } from "express-validator";


// Crear una rutina Entrenador
const createRoutineEntrenador = async (req, res) => {
  const { name, description } = req.body;
  const datos = req.body
  const idUserRutina = datos.userId;
  
  try {
    if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe enviar todos los datos"});
    if (!name) return res.status(203).json({msg: "Debe ingresar el nombre del entrenamiento"});
    if (!description) return res.status(203).json({msg: "Debe ingresar una descripción para la rutina"});
    if (!idUserRutina) return res.status(203).json({msg: "Debe ingresar el id de un usuario"});
    
    if (!mongoose.isValidObjectId(idUserRutina)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
    const objectId = new mongoose.Types.ObjectId(idUserRutina);

    const usuario = await User.findById(objectId);
    
    if (usuario.role !== "cliente") return res.status(203).json({msg: "Sólo clientes pueden poseer rutinas"});

    await check("name")
          .isString()
          .trim()
          .isLength({ min: 5, max: 50 })
          .withMessage("El nombre debe tener entre 5 y 40 dígitos")
          .run(req);

    await check("description")
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

    if (datos.exercises)
    {
      for (const [index, ejercicio] of datos.exercises.entries()) {
        await check(`exercises[${index}].name`)
              .optional()
              .trim()
              .isString()
              .isLength({min: 2, max: 40})
              .withMessage("El nombre del ejercicio debe tener entre 2 y 40 dígitos")
              .run(req)
        
        await check(`exercises[${index}].series`)
              .optional()
              .trim()
              .isInt({min: 1})
              .withMessage("Las series deben ser número enteros positivos")
              .run(req)

        await check(`exercises[${index}].repetitions`)
              .optional()
              .trim()
              .isFloat({min: 1, max: 3600})
              .withMessage("Las repeticiones deben ser números positivos")
              .run(req)
      };
      const erroresEjercicios = validationResult(req);
      if (!erroresEjercicios.isEmpty()) {
        return res.status(400).json({
          msg: "Errores en la validación de campos de ejercicios",
          errores: erroresEjercicios.array()
        });
      };
    };
    
    const newRoutine = new Routine({ ...req.body });
    newRoutine.idUserRutina = objectId;
    await newRoutine.save();
    
    return res.status(201).json({msg: "Rutina creada satisfactoriamente"});
  }
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar crear una rutina",
      error: error.message
    });
  }
};
// Crear una rutina
const createRoutine = async (req, res) => {
  const { name, description } = req.body;
  const datos = req.body
  const idUserRutina = req.user._id
  
  try {
    if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe enviar todos los datos"});
    if (!name) return res.status(203).json({msg: "Debe ingresar el nombre del entrenamiento"});
    if (!description) return res.status(203).json({msg: "Debe ingresar una descripción para la rutina"});
    if (!idUserRutina) return res.status(203).json({msg: "Debe ingresar el id de un usuario"});
    
    if (!mongoose.isValidObjectId(idUserRutina)) return res.status(203).json({msg: "Debe ingresar un id de usuario correcto"});     
    const objectId = new mongoose.Types.ObjectId(idUserRutina);

    await check("name")
          .isString()
          .trim()
          .isLength({ min: 5, max: 40 })
          .withMessage("El nombre debe tener entre 5 y 40 dígitos")
          .run(req);

    await check("description")
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

    if (datos.exercises)
    {
      for (const [index, ejercicio] of datos.exercises.entries()) {
        await check(`exercises[${index}].name`)
              .optional()
              .trim()
              .isString()
              .isLength({min: 2, max: 40})
              .withMessage("El nombre del ejercicio debe tener entre 2 y 40 dígitos")
              .run(req)
        
        await check(`exercises[${index}].series`)
              .optional()
              .trim()
              .isInt({min: 1})
              .withMessage("Las series deben ser número enteros positivos")
              .run(req)

        await check(`exercises[${index}].repetitions`)
              .optional()
              .trim()
              .isFloat({min: 1, max: 3600})
              .withMessage("Las repeticiones deben ser números positivos")
              .run(req)
      };
      const erroresEjercicios = validationResult(req);
      if (!erroresEjercicios.isEmpty()) {
        return res.status(400).json({
          msg: "Errores en la validación de campos de ejercicios",
          errores: erroresEjercicios.array()
        });
      };
    };
    
    const newRoutine = new Routine({ ...req.body });
    newRoutine.idUserRutina = objectId;
    await newRoutine.save();
    
    return res.status(201).json({msg: "Rutina creada satisfactoriamente"});
  }
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar crear una rutina",
      error: error.message
    });
  }
};






















// Obtener una rutina por Username Entrenador
const getRoutinesByUsernameEntrenador = async (req, res) => {
  try {
    const { username } = req.params;
    const userBd = await User.findOne({ username });
    
    if (!userBd) return res.status(203).json({msg: "No existe usuario con ese username"});
    const rutinas = await Routine.find({ idUserRutina: userBd._id});

    if (!rutinas) {
      return res.status(404).json({ msg: "Rutina no encontrada" });
    }

    return res.status(200).json(rutinas);
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar obtener las rutinas de un usuario",
      error: error.message
    });
  }
};
// Obtener una rutina por Username
const getRoutinesByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const userBd = await User.findOne({ username });
    if (!userBd._id.equals(req.user._id)) return res.status(203).json({ msg: "No puede listar las rutinas de otro usuario" });
    if (!userBd) return res.status(203).json({msg: "No existe usuario con ese username"});
    const rutinas = await Routine.find({ idUserRutina: userBd._id});

    if (!rutinas) {
      return res.status(404).json({ msg: "Rutina no encontrada" });
    }

    return res.status(200).json(rutinas);
  } 
  catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar obtener las rutinas de un usuario",
      error: error.message
    });
  }
};

























// Actualizar una rutina Entrenador
const updateRoutineEntrenador = async (req, res) => {
  //_id de la rutina
  const { _id } = req.params;
  const datos = req.body;
  
  delete datos._id;
  delete datos.idUserRutina;
  delete datos.createdAt;
  delete datos.updatedAt;
  delete datos.__v;

  try {
    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({ msg: "El id de la rutina no es válido" });  
    const idObject = new mongoose.Types.ObjectId(_id);

    const rutina = await Routine.findOne({_id: idObject});

    if (!rutina) return res.status(203).json("Rutina no encontrada");


    if (Object.values(datos).includes("")) return res.status(203).json({ msg: "Debe ingresar los valores en todos los campos" })

    await check("name")
          .optional()
          .trim()
          .isString()
          .isLength({ min: 5, max: 50 })
          .withMessage("El nombre debe tener entre 5 y 50 dígitos")
          .run(req);

    await check("description")
          .optional()
          .trim()
          .isString()
          .isLength({min: 1, max:400})
          .withMessage("La descripción debe tener contenido. Máximo 400 dígitos.")
          .run(req);

    let errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({
        msg: "Errores en la validación de campos",
        errores: errores.array()
      });
    };

    if (datos.exercises)
    {
      for (const [index, ejercicio] of datos.exercises.entries()) {
        await check(`exercises[${index}].name`)
              .optional()
              .trim()
              .isString()
              .isLength({min: 2, max: 40})
              .withMessage("El nombre del ejercicio debe tener entre 2 y 40 dígitos")
              .run(req)
        
        await check(`exercises[${index}].series`)
              .optional()
              .trim()
              .isInt({min: 1})
              .withMessage("Las series deben ser número enteros positivos")
              .run(req)

        await check(`exercises[${index}].repetitions`)
              .optional()
              .trim()
              .isFloat({min: 1, max: 3600})
              .withMessage("Las repeticiones deben ser números positivos")
              .run(req)
      };
      const erroresEjercicios = validationResult(req);
      if (!erroresEjercicios.isEmpty()) {
        return res.status(400).json({
          msg: "Errores en la validación de campos de ejercicios",
          errores: erroresEjercicios.array()
        });
      };
    };

    const updatedRoutine = await Routine.findOneAndUpdate(
      idObject,
      { ...datos },
      { new: true }
    );

    if (!updatedRoutine) {
      return res.status(404).json({ msg: "La rutina no existe o no se puede actualizar" });
    }
  
    return res.status(200).json({msg: "La rutina ha sido actualizada satisfactoriamente", updatedRoutine});

  } 
  catch (error) 
  {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar actualizar una rutina",
      error: error.message
    });
  }
};

// Actualizar una rutina CLIENTE
const updateRoutine = async (req, res) => {
  //_id de la rutina
  const { _id } = req.params;
  const datos = req.body;
  
  delete datos._id;
  delete datos.idUserRutina;
  delete datos.createdAt;
  delete datos.updatedAt;
  delete datos.__v;


  try {
    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({ msg: "El id de la rutina no es válido" });  
    const idObject = new mongoose.Types.ObjectId(_id);

    const rutina = await Routine.findOne({_id: idObject});

    if (!rutina) return res.status(203).json("Rutina no encontrada");
  
    if (!rutina.idUserRutina.equals(req.user._id)) return res.status(203).json({ msg: "No puede modificar la rutina de un usuario diferente" });


    if (Object.values(datos).includes("")) return res.status(203).json({ msg: "Debe ingresar los valores en todos los campos" })

    await check("name")
          .optional()
          .trim()
          .isString()
          .isLength({ min: 5, max: 50 })
          .withMessage("El nombre debe tener entre 5 y 50 dígitos")
          .run(req);

    await check("description")
          .optional()
          .trim()
          .isString()
          .isLength({min: 1, max:400})
          .withMessage("La descripción debe tener contenido. Máximo 400 dígitos.")
          .run(req);

    let errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({
        msg: "Errores en la validación de campos",
        errores: errores.array()
      });
    };

    if (datos.exercises)
    {
      for (const [index, ejercicio] of datos.exercises.entries()) {
        await check(`exercises[${index}].name`)
              .optional()
              .trim()
              .isString()
              .isLength({min: 2, max: 40})
              .withMessage("El nombre del ejercicio debe tener entre 2 y 40 dígitos")
              .run(req)
        
        await check(`exercises[${index}].series`)
              .optional()
              .trim()
              .isInt({min: 1})
              .withMessage("Las series deben ser número enteros positivos")
              .run(req)

        await check(`exercises[${index}].repetitions`)
              .optional()
              .trim()
              .isFloat({min: 1, max: 3600})
              .withMessage("Las repeticiones deben ser números positivos")
              .run(req)
      };
      const erroresEjercicios = validationResult(req);
      if (!erroresEjercicios.isEmpty()) {
        return res.status(400).json({
          msg: "Errores en la validación de campos de ejercicios",
          errores: erroresEjercicios.array()
        });
      };
    };

    const updatedRoutine = await Routine.findOneAndUpdate(
      idObject,
      { ...datos },
      { new: true }
    );

    if (!updatedRoutine) {
      return res.status(404).json({ msg: "La rutina no existe o no se puede actualizar" });
    }
  
    return res.status(200).json({msg: "La rutina ha sido actualizada satisfactoriamente", updatedRoutine});

  } 
  catch (error) 
  {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar actualizar una rutina",
      error: error.message
    });
  }
};





















// Eliminar una rutina Entrenador
const deleteRoutineEntrenador = async (req, res) => {
  const { _id } = req.params;

  try {
    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "La id es inválida"});
    const idObject = new mongoose.Types.ObjectId(_id);
    const rutinaBD = await Routine.findOne({ _id: idObject });

    if (!rutinaBD) return res.status(203).json({msg: "La rutina a eliminar no existe"});

    const deletedRoutine = await Routine.findOneAndDelete({_id: idObject});

    if (!deletedRoutine) {
      return res.status(404).json({ msg: "La rutina no se pudo eliminar" });
    }

    return res.status(200).json({ msg: "Rutina eliminada con éxito" });
  } catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar eliminar una rutina",
      error: error.message
    });
  }
};

// Eliminar una rutina Entrenador
const deleteRoutine = async (req, res) => {
  const { _id } = req.params;

  try {
    if (!mongoose.isValidObjectId(_id)) return res.status(203).json({msg: "La id es inválida"});
    const idObject = new mongoose.Types.ObjectId(_id);
    const rutinaBD = await Routine.findOne({ _id: idObject });
    if (!rutinaBD.idUserRutina.equals(req.user._id)) return res.status(203).json({ msg: "No puede eliminar la rutina de un usuario diferente" });
    if (!rutinaBD) return res.status(203).json({msg: "La rutina a eliminar no existe"});

    const deletedRoutine = await Routine.findOneAndDelete({_id: idObject});

    if (!deletedRoutine) {
      return res.status(404).json({ msg: "La rutina no se pudo eliminar" });
    }

    return res.status(200).json({ msg: "Rutina eliminada con éxito" });
  } catch (error) {
    return res.status(500).json({
      succes: false,
      msg: "Error al intentar eliminar una rutina",
      error: error.message
    });
  }
};

export {
  createRoutineEntrenador,
  createRoutine,
  

  getRoutinesByUsernameEntrenador,
  getRoutinesByUsername,
  
  
  updateRoutineEntrenador,
  updateRoutine,


  deleteRoutineEntrenador,
  deleteRoutine,
};
