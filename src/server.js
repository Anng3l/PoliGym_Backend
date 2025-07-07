import express from "express";

//Routers
import routerUsers from "./routers/users_router.js";
import routerRutinas from "./routers/routines_router.js";
import routerProgresos from "./routers/progresos_router.js";
import routerAuth from "./routers/auth_router.js";
import routerAsistencias from "./routers/asistencias_router.js";
import routerAlimentacion from "./routers/alimentacion_router.js";

import dotenv from "dotenv"
import dbConnect from "./config/dbConnect.js";

import cookieParser from "cookie-parser";
import cors from "cors"

//Inicia la conexión a la bd en MongoDB
dbConnect();
//Carga e inyecta las variables de entorno al objeto global process.env (objeto que contiene las vvariables de entorno disponibles en esta app)
dotenv.config();


const app = express();


const PORT = process.env.PORT || 7001;
app.set("port", PORT);

app.use(express.json());
    //Middleware para cookies
app.use(cookieParser());



app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            //Permitir si viene de servicios como Postman, Insomnia, etc.
            return callback(null, true);
        } else {
            return callback(new Error("CORS: Access denied from browser-based origin"));
        }
    },
    methods: "GET,POST,PUT,DELETE,OPTIONS"
}));




app.get("/", (req, res) => {
    res.send("Server On");
})
app.use("/api", routerUsers);
app.use("/api", routerRutinas);
app.use("/api", routerProgresos);
app.use("/api", routerAuth);
app.use("/api", routerAsistencias);
app.use("/api", routerAlimentacion);


export default app;