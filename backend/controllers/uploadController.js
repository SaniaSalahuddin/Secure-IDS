import axios from "axios";
import fs from "fs";
import csv from "csv-parser";
import FormData from "form-data";
import path from "path";
import Attack from "../models/Attack.js";

const ML_BASE_URL = process.env.ML_API_URL?.replace(/\/predict$/, "") || "http://localhost:8000";
const ML_PREDICT_URL = `${ML_BASE_URL}/predict`;
const ML_PCAP_URL = `${ML_BASE_URL}/predict-pcap`;

const PCAP_EXTENSIONS = [".pcap", ".pcapng"];

const isPcapFile = (filename = "") => {
    const ext = path.extname(filename).toLowerCase();
    return PCAP_EXTENSIONS.includes(ext);
};

const buildResponse = (mlData, extra = {}) => {
    const summary = mlData.summary || mlData;
    const attackType = summary.attack_type;
    const confidence =
        summary.confidence_percentage ??
        (summary.confidence != null ? summary.confidence * 100 : null);

    return {
        message: extra.message || "File analyzed successfully",
        attackType,
        isAttack: summary.is_attack,
        confidence,
        status: summary.status,
        totalRows: mlData.total_rows ?? 0,
        attacksDetected: summary.attacks_detected ?? 0,
        safeRows: summary.safe_rows ?? 0,
        predictions: mlData.predictions ?? [],
        source: mlData.source || "csv",
        sourceFile: mlData.source_file || extra.sourceFile,
        note: mlData.note || null,
    };
};

const saveAndRespond = async (req, res, payload, filePath) => {
    const attack = await Attack.create({
        attackType: payload.attackType,
        confidence: payload.confidence ?? 0,
        uploadedBy: req.user.userId,
    });

    if (filePath) {
        fs.unlink(filePath, () => {});
    }

    res.json({
        ...payload,
        attack,
    });
};

const parseMlError = (err) => {
    const mlDetail = err.response?.data?.detail;
    const detailMessage = Array.isArray(mlDetail)
        ? mlDetail.map((d) => d.msg).join(", ")
        : typeof mlDetail === "string"
          ? mlDetail
          : null;

    return (
        err.response?.data?.error ||
        detailMessage ||
        err.response?.data?.message ||
        err.message
    );
};

const analyzePcap = async (filePath, originalName) => {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
        filename: originalName,
        contentType: "application/octet-stream",
    });

    const mlResponse = await axios.post(ML_PCAP_URL, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });

    return mlResponse.data;
};

const analyzeCsvRows = async (rows) => {
    const mlResponse = await axios.post(ML_PREDICT_URL, { data: rows });
    return mlResponse.data;
};

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;

        if (isPcapFile(originalName)) {
            try {
                const mlData = await analyzePcap(filePath, originalName);

                if (!mlData.success) {
                    return res.status(500).json({
                        message: mlData.error || "Wireshark conversion failed",
                    });
                }

                const payload = buildResponse(mlData, {
                    message: "Wireshark capture analyzed successfully",
                    sourceFile: originalName,
                });

                return await saveAndRespond(req, res, payload, filePath);
            } catch (err) {
                const message = parseMlError(err);
                return res.status(err.response?.status || 500).json({ message });
            }
        }

        const rows = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", async () => {
                try {
                    if (rows.length === 0) {
                        return res.status(400).json({ message: "CSV file is empty" });
                    }

                    const mlData = await analyzeCsvRows(rows);

                    if (!mlData.success) {
                        return res.status(500).json({
                            message: mlData.error || "Model prediction failed",
                        });
                    }

                    const payload = buildResponse(mlData, { sourceFile: originalName });
                    await saveAndRespond(req, res, payload, filePath);
                } catch (err) {
                    res.status(err.response?.status || 500).json({
                        message: parseMlError(err),
                    });
                }
            })
            .on("error", () => {
                res.status(500).json({ message: "Failed to read CSV file" });
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
