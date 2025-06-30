import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";

import User from "../models/users_model.js";
import nodemailerMethods from "../config/nodemailer.js";

const getAllUsersController = async (req, res) => {
    try
    {
        const data = await User.find().select("-password");

        if (data)
        {
            return res.status(200).json(data);
        }
        else
        {
            return res.status(200).json({msg: "No hay usuarios registrados"});
        }
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al listar todos los usuarios",
            error: error.message
        });
    }
};

const getOneUserController = async (req, res) => {
    const { username } = req.params;

    try
    {
        const data = await User.findOne({username}).select("-password");
        if (!data) return res.status(203).json({msg: "No existe usuario con ese nombre de usuario"})
        return res.status(200).json(data);
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al listar un usuario",
            error: error.message
        });
    }
};



const getUsersByRoleController = async (req, res) => {
    const { role } = req.params;

    try
    {
        if (!["administrador", "entrenador", "cliente"].includes(role)) return res.status(203).json({msg: "El rol ingresado es incorrecto"});
        const data = await User.find({role}).select("-password");
        if (!data) return res.status(203).json({msg: `No se encontraron usuarios con el rol ${role}`});
        return res.status(200).json(data);
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al listar usuarios por rol",
            error: error.message
        });
    }
};


const createUserController = async (req, res) => {
    const { name, username, lastname, email, password, role } = req.body;

    await check("username")
        .isAlphanumeric()
        .trim()
        .withMessage("Debe tener sólo letras y números")
        .isLength({min: 3, max: 10})
        .withMessage("El nombre de usuario debe tener entre 3 y 10 dígitos")
        .run(req);
    
    await check("name")
        .isLength({min: 3, max: 15})
        .trim()
        .isString()
        .withMessage("El nombre debe tener entre 3 y 15 dígitos")
        .run(req);

    await check("lastname")
        .isLength({min: 2, max: 15})
        .trim()
        .isString()
        .withMessage("El apellido debe tener entre 2 y 15 dígitos")
        .run(req);
        
    await check("email")
        .isEmail()
        .trim()
        .withMessage("El email no tiene formato válido")
        .normalizeEmail()
        .run(req);

    await check("password")
        .isStrongPassword({ minLength: 8 })
        .trim()
        .isLength({max: 20})
        .withMessage("La contraseña debe tener entre 8 y 20 dígitos de longitud")
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@_-])/)
        .withMessage("La contraseña no cumple con el formato mínimo")
        .run(req);

    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.status(400).json({
            msg: 'Errores de validación',
            errores: errores.array()
        });
    }

    try
    {
            //Validaciones
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Faltan datos para crear usuario"});
        let userBDControll = await User.findOne({username});
        if (userBDControll) return res.status(203).json({msg: "Username ya registrado"});
        userBDControll = await User.findOne({email});
        if (userBDControll) return res.status(203).json({msg: "Email ya registrado"});
        if (!["administrador", "entrenador", "cliente"].includes(role)) return res.status(203).json({msg: "El rol ingresado es incorrecto"});

            //Hasheo de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
            //Construcción del objeto con los datos del usuario a crear
        const newUserData = await User.create({
            name,
            lastname,
            username,
            email,
            password: hashedPassword,
            role
        });

        const token = newUserData.createToken();
        nodemailerMethods.sendMailToUser(email, token);

        await newUserData.save();
        return res.status(200).json({msg: "Usuario registrado correctamente"})
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar crear un usuario",
            error: error.message
        });
    }
};



const updateUserController = async (req, res) => {
    //Obtención de los datos a pasar a la llamada al modelo
    const { username } = req.params;
    const datos = req.body;

    delete datos._id;
    delete datos.token;
    delete datos.confirmEmail;
    delete datos.refreshToken;
    delete datos.recoverPassword;
    delete datos.password;

    await check("username")
        .optional()
        .trim()
        .isString()
        .withMessage("Debe tener sólo letras y números")
        .isLength({min: 3, max: 10})
        .withMessage("El nombre de usuario debe tener entre 5 y 10 dígitos")
        .run(req);
    
    await check("name")
        .optional()
        .trim()
        .isString()
        .isLength({min: 3, max: 15})
        .withMessage("EL nombre debe tener entre 5 y 15 dígitos")
        .run(req);
        
    await check("lastname")
        .optional()
        .trim()
        .isString()
        .isLength({min: 2, max: 15})
        .withMessage("EL nombre debe tener entre 5 y 15 dígitos")
        .run(req);

    await check("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("El email no tiene formato válido")
        .normalizeEmail()
        .run(req);


    const errores = validationResult(req);

    if (!errores.isEmpty())
    {
        return res.status(400).json({
            msg: 'Errores de validación',
            errores: errores.array()
        });
    }

    let newData = {...datos};

    try
    {
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Debe ingresar datos para actualizar los datos del usuario"})
        const userBD = await User.findOne({username});
        if (!userBD) return res.status(203).json({msg: "No existe usuario con ese username"});

        //Llamada al modelo con manejo de error
        const data = await User.updateOne({username}, {$set:newData});

        if (data.matchedCount===0) return res.status(404).json({msg: "Usuario no encontrado"});

        return res.status(200).json({msg:"Actualización realizada correctamente"});
    }
    catch(error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar actualizar un usuario",
            error: error.message
        });
    }
};


const deleteOneUserController = async (req, res) => {
    const { username } = req.params;

    try
    {
        const userBD = await User.findOne({ username });
        if (!userBD) return res.status(203).json({msg: "No existe un usuario con ese username"});
        const deletedUser = await User.findOneAndDelete({username});
        if (!deletedUser) return res.status(203).json({msg: "No se pudo eliminar el usuario"});
        return res.status(200).json({msg: `Usuario ${username} eliminado correctamente`});
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar eliminar un usuario",
            error: error.message
        });
    }
}


export {
    getAllUsersController,
    getOneUserController,
    getUsersByRoleController,
    createUserController,
    updateUserController,
    deleteOneUserController
}