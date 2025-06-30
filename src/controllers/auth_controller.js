import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

//import autenticacion from "../models/auth_model.js"
import { createToken } from "../middlewares/auth.js";
import User from "../models/users_model.js";
import nodemailerMethods from "../config/nodemailer.js";
import mongoose from "mongoose";

const logInController = async (req, res) => {
    //const cookies = req.cookies;
    const {email, password} = req.body;

    await check("email")
        .isEmail()
        .trim()
        .withMessage("El email no tiene formato válido")
        .normalizeEmail()
        .run(req);

    const errores = validationResult(req);
    
    if (!errores.isEmpty()) {
        return res.status(400).json({
            msg: 'Errores de validación',
            errores: errores.array()
        });
    };

    try
    {
        //Verificar que no hayan campos vacíos
        if (Object.values(req.body).includes("")) return res.status(400).json({
            msg: "Todos los campos son obligatorios"
        })

        const user = await User.findOne({email});
        if (!user)
        {
            return res.status(404).json({ msg: `Credenciales incorrectas` });
        }

        const passWordMatch = await bcrypt.compare(password, user.password);

        if (!passWordMatch)
        {
            return res.status(404).json({ msg: "Credenciales incorrectas" });
        }

        //Generación de jwt de acceso y de refresco
        const token = await createToken({_id: user._id, role: user.role});
        
        await user.save();

        return res.status(200).json({token, role: user.role, _id: user._id, username: user.username, name: user.name, lastname: user.lastname});
    }
    catch(error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar iniciar sesión",
            error: error.message
        });
    };
};

const registerController = async (req, res) => {
    try
    {
        //Separar entre contraseña y los demás datos
        const {username, email, password, confirmPassword } = req.body;
        

        if (!email.endsWith('@epn.edu.ec')) {
            return res.status(400).json({
                error: 'El correo debe pertenecer al dominio @epn.edu.ec',
            });
        }

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
            .withMessage("El nombre debe tener entre 3 y 15 dígitos")
            .matches(/^[A-Za-z]+$/)
            .withMessage("El nombre debe contener sólo letras")
            .run(req);
    
        await check("lastname")
            .isLength({min: 2, max: 15})
            .trim()
            .withMessage("El apellido debe tener entre 2 y 15 dígitos")
            .matches(/^[A-Za-z]+$/)
            .withMessage("El apellido debe contener sólo letras")
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
        };

            //Verificar que no hayan campos vacíos
        if (Object.values(req.body).includes("")) return res.status(400).json({
            msg: "Todos los campos son obligatorios"
        })
            //Verificar que el correo no haya sido utilizado anteriormente
        const correoUnico = await User.findOne({email});
        if (correoUnico) return res.status(400).json({
            msg: "Correo ya registrado"
        });

            //Verificar que el username no haya sido utilizado anteriormente
        const usernameExiste = await User.findOne({username});
        if (usernameExiste) return res.status(400).json({msg: "Username ya existente"})

            //Verificar contraseña
        if (confirmPassword !== password)
        {
            return res.status(500).json({
                msg: "Contraseñas distintas"
            });
        }
            
            //Construir el json con los datos del usuario a registrar
        const nuevoUsuario = new User(req.body);        
        nuevoUsuario.role = "cliente";
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password);

            //Crear token y enviar email
        const token = nuevoUsuario.createToken();
        nodemailerMethods.sendMailToUser(email, token);

        nuevoUsuario.token = token;

        //Se manda a la BD
        await nuevoUsuario.save();

        return res.status(201).json({msg: `Usuario ${nuevoUsuario.username} registrado satisfactoriamente`})
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar registrarse",
            error: error.message
        });
    };
};

const verificacionDeRegistroController = async (req, res) => {
    try
    {
        const { token, email } = req.query;
        
        if (!token) return res.status(500).json({msg: "Token no enviado o inválido"});

        const clienteToken = await User.findOne({email});
        if (!clienteToken.token) return res.status(500).json({msg: "La cuenta ya ha sido confirmada"});

        if (clienteToken.token !== token)
        {
            return res.status(203).json({msg: "Tokens diferentes"});    
        }

        clienteToken.token = null;
        clienteToken.confirmEmail = true;
        await clienteToken.save();
        return res.status(200).json({msg: "Registro confirmado satisfactoriamente"});
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar verificar registro",
            error: error.message
        });
    }    
};

const refreshTokenController = async (req, res) => {
    try
    {   
        //No hace falta destructurar las cookies pues cookie-parser las convierte a objeto
        const cookies = req.cookies;

        if (!cookies?.jwt) return res.status(401).json({msg: "Cookie o jwt no provisto en las cookies"});
        const refreshedJwt = cookies.jwt.trim();         //------------------------------------------------------------------------------------------------------------------------------------
        res.clearCookie("jwt", { httpOnly: true, secure: true});
        const userBD = await User.findOne({refreshToken: refreshedJwt});
        
        //Reutilización del Refresh JWT
        if (!userBD) {
            jwt.verify (
                refreshedJwt,
                process.env.REFRESH_JWT_SECRET,
                async (error, decoded) => {
                    //JWT inválido
                    if (error) return res.status(403).json({msg: "JWt inválido"});
                    //JWT válido y utilizado
                    let hackedUserBD = await User.findOne({ _id: decoded._id });
                    hackedUserBD.refreshToken = [];
                    await hackedUserBD.save();

                    return res.status(403).json({msg: "No existe usuario asociado con el jwt de refresco"});
                }
            )
        }
        
        //Para la autenticación en múltiples dispositivos
        let newJwtArray = userBD.refreshToken.filter(rt => rt !== refreshedJwt);

        jwt.verify(
            refreshedJwt,
            process.env.REFRESH_JWT_SECRET,
            async (error, decoded) => {
                //JWT expirado o manipulado
                let idObject = new mongoose.Types.ObjectId(`${decoded._id}`);
                
                //console.log("Id usuario: ", typeof(userBD._id), userBD._id, "Decoded: ", typeof(idObject), idObject);
                
                if (error || !userBD._id.equals(idObject)) return res.status(401).json({msg: "Error en la verificación del JWT de refresco"});
                //JWT aún es válido
                const accessJwt = jwt.sign(
                    { _id: decoded._id, role: decoded.role },
                    process.env.JWT_SECRET,
                    {expiresIn: "15m"}
                );
                
                const token = jwt.sign(
                    { _id: decoded._id, role: decoded.role },
                    process.env.REFRESH_JWT_SECRET,
                    {expiresIn: "24h"}
                );
                userBD.refreshToken = [...newJwtArray, token];
                await userBD.save();

                res.cookie("jwt", token, {httpOnly: true, secure: true, maxAge: 86400000});
                return res.status(200).json({accessJwt, role: decoded.role, _id: decoded._id})
            }    
        );
    }
    catch(error) {
        return res.status(500).json({
            succes: false,
            msg: "Error en la generación de nuevo JWT",
            error: error.message
        });
    }
}

const logOutController = async (req, res) => {
    //En el frontend también se debe eliminar el jwt
    const cookies = req.cookies;

    try
    {
        if (!cookies?.jwt) return res.status(203).json({msg: "Cookie o jwt no enviado"});
        const refreshJwt = cookies.jwt.trim();
        const userBD = await User.findOne({refreshToken: refreshJwt});

        //Reutilización de jwt de refresco
        if (!userBD)
        {
            jwt.verify (
                refreshJwt,
                process.env.REFRESH_JWT_SECRET,
                async (error, decoded) => {
                    if (error) return res.status(500).json({msg: "Error en el JWT de refresco"});
                    let hackedUser = await User.findOne({_id: decoded._id});
                    if (!hackedUser) return res.status(203).json({msg: "No existe usuario -- logout"})
                    hackedUser.refreshToken = [];
                    await hackedUser.save();

                    res.clearCookie("jwt", { httpOnly: true, secure: true });
                    return res.status(203).json({msg: "No existe usuario con dicho jwt de refresco"});
                }
            );
            return;
        };
        
        //Para autenticación en múltiples dispositivos
        userBD.refreshToken = userBD.refreshToken.find(rt => rt !== refreshJwt);
        await userBD.save();
        
        res.clearCookie("jwt", { httpOnly: true, secure: true });
        return res.status(200).json({msg: `JWT de refresco eliminado exitosamente del usuario ${userBD.username}`});
    }
    catch (error) {
        return res.status(500).json({
            succes: false,
            msg: "Error en el logout",
            error: error.message
        });
    }
};

const recoverPasswordMailingController = async (req, res) => {
    //Obtención de datos
    const { email } = req.body;

    await check("email")
        .isEmail()
        .trim()
        .withMessage("El email no tiene formato válido")
        .normalizeEmail()
        .run(req);

    const errores = validationResult(req);
    
    if (!errores.isEmpty()) {
        return res.status(400).json({
            msg: 'Errores de validación',
            errores: errores.array()
        });
    };

    try
    {
        //Verificaciones
        if (!email) return res.status(203).json({msg: "Correo no proporcionado"});
        const userBD = await User.findOne({email});
        if (!userBD) return res.status(404).json({msg: "No existe usuario con ese correo"});

        //Operaciones sobre la BD
        const token = userBD.createToken();
        userBD.token = token;
        const userId = userBD._id.toString();
        nodemailerMethods.sendMailToUserRecovery(email, token, userId);

        await userBD.save();

        return res.status(200).json({msg: "Revise su correo para restablecer su contraseña"});
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar recuperar contraseña",
            error: error.message
        });
    }
};

const confirmTokenController = async (req, res) => {
    //Obtención de datos
    const { token, userId } = req.query;

    try 
    {
        //Verificaciones
        if (!token) return res.status(203).json({msg: "Token no proporcionado"});
        if (!userId) return res.status(203).json({msg: "Id de usuario no proporcionada"});
        if (!mongoose.isValidObjectId(userId)) return res.status(203).json({msg: "El id proporcionado es inválido"});
        const idUser = new mongoose.Types.ObjectId(userId);
        const userBD = await User.findOne({ _id: idUser });
        if (!userBD) return res.status(203).json({msg: "No existe el usuario requerido"});

        //Manejo de la BD
        userBD.recoverPassword = true;
        userBD.token = null;
        await userBD.save();

        res.cookie("userId", idUser, {httpOnly: true, secure: true, maxAge: 86400000});
    
        return res.status(200).json({msg: "Su identidad ha sido verificada. Ya puede restablecer su contraseña.", idUser: userId});
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar recuperar contraseña",
            error: error.message
        });
    }
};

const recoverPasswordController = async (req, res) => {
    const {idUser, password, confirmPassword} = req.body;

    await check("password")
        .isStrongPassword({ minLength: 8 })
        .trim()
        .isLength({max: 20})
        .withMessage("La contraseña debe tener entre 8 y 20 dígitos de longitud")
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@_-])/)
        .withMessage("La contraseña no cumple con el formato mínimo")
        .run(req);

    await check("confirmPassword")
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
        if (Object.values(req.body).includes("")) return res.status(203).json({msg: "Envíe todos los datos solicitados"});
        const idObject = req.body.idUser
        if (!mongoose.isValidObjectId(idObject)) return res.status(203).json({msg: "La id es inválida"});
        const idUser = new mongoose.Types.ObjectId(idObject);
        const userBD = await User.findOne({_id: idUser});
        if (!userBD)
        {
            res.clearCookie("userId", {httpOnly: true, secure: true});    
            return res.status(203).json({msg: "No se encontró usuario"});
        } 
        if (!userBD.recoverPassword) return res.status(203).json({msg: "Error al recuperar la contraseña"})

        if (password !== confirmPassword) return res.status(203).json({msg: "Las contraseñas no son las mismas"});

        userBD.password = await userBD.encryptPassword(password);
        userBD.recoverPassword = false;
        userBD.token = null;

        await userBD.save();

        res.clearCookie("userId", {httpOnly: true, secure: true});
        return res.status(200).json({msg: "Contraseña restablecida exitosamente"});
    }
    catch (error)
    {
        return res.status(500).json({
            succes: false,
            msg: "Error al intentar restablecer la contraseña",
            error: error.message
        });
    }
}

export {
    logInController,
    registerController,
    verificacionDeRegistroController,
    refreshTokenController,
    logOutController,
    recoverPasswordMailingController,
    confirmTokenController,
    recoverPasswordController
}