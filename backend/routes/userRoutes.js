import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
    getUsers,
    updateUserRole,
    deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
