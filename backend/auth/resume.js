import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (_req, file, cb) => {
		const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
		cb(null, `${Date.now()}-${safeName}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
	fileFilter: (_req, file, cb) => {
		const allowed = [".pdf", ".docx", ".doc"];
		const ext = path.extname(file.originalname).toLowerCase();
		if (allowed.includes(ext)) {
			cb(null, true);
		} else {
			cb(new Error("Only PDF and DOCX files are allowed"));
		}
	},
});

// Upload resume
router.post("/upload", authenticate, upload.single("resume"), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });
	try {
		const result = await db.query("INSERT INTO resumes (user_id, file_name, file_path) VALUES ($1, $2, $3) RETURNING *", [req.user.id, req.file.originalname, `/uploads/${req.file.filename}`]);
		res.json({ resume: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all resumes for user
router.get("/", authenticate, async (req, res) => {
	try {
		const result = await db.query("SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
		res.json({ resumes: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete a resume
router.delete("/:id", authenticate, async (req, res) => {
	try {
		const result = await db.query("DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING *", [req.params.id, req.user.id]);
		if (!result.rows[0]) return res.status(404).json({ error: "Resume not found" });
		// Remove file from disk
		const filePath = path.resolve(`.${result.rows[0].file_path}`);
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		res.json({ message: "Resume deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
