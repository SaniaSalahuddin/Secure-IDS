import express from "express";
import multer from "multer";
import path from "path";
import { uploadFile } from "../controllers/uploadController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

const ALLOWED_EXTENSIONS = [".csv", ".pcap", ".pcapng"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only CSV, PCAP, and PCAPNG files are allowed"), false);
        }
    },
});

router.post(
    "/",
    authMiddleware,
    authorizeRoles("admin", "analyst"),
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    message: err.message || "File upload failed",
                });
            }
            next();
        });
    },
    uploadFile
);

export default router;
