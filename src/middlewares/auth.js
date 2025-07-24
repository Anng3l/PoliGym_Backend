import jwt from "jsonwebtoken";


const createRefreshToken = async (userInfo) => {
    return jwt.sign(userInfo, process.env.REFRESH_JWT_SECRET, {expiresIn: "24h"});
};

const verifyRefreshToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        return res.status(401).json({msg: "Token no enviado"});
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.REFRESH_JWT_SECRET, (error, decoded) => {
        if (error)
        {
            return res.status(401).json({msg: "Fallo al autenticar"});
        }
        req.user = decoded;

        next();
    })
}








const createToken = async (userInfo) => {
    return jwt.sign(userInfo, process.env.JWT_SECRET, {expiresIn: "15m"});
};

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        return res.status(401).json({msg: "Token no enviado"});
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error)
        {
            return res.status(401).json({msg: "Fallo al autenticar"});
        }
        req.user = decoded;

        next();
    })
}




export {
    createRefreshToken,
    verifyRefreshToken,


    createToken,
    verifyToken
}
