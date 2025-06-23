import { createUserController, deleteOneUserController, getAllUsersController, getOneUserController, getUsersByRoleController, updateUserController } from "../controllers/user_controller.js";
import app from "../server.js";
import { Router } from "express";

import { verifyToken } from "../middlewares/auth.js";
import { authorizedRoles } from "../middlewares/roleAuthMiddleware.js";
import { accountVerificationMiddleware } from "../middlewares/accountVerification.js";

const router = Router();

router.post("/users", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador"), createUserController);
router.put("/users/:username", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador"), updateUserController);
router.get("/users", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador", "entrenador"), getAllUsersController);
router.get("/users/:username", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador"), getOneUserController);
router.get("/users/role/:role", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador"), getUsersByRoleController);
router.delete("/users/:username", verifyToken, accountVerificationMiddleware, authorizedRoles("administrador"), deleteOneUserController);

export default router;