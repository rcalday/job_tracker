import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Upload resume (assume file upload handled elsewhere, e.g., multer)
router.post("/upload", authenticate, async (req, res) => {
	const { fileName, filePath, parsedData } = req.body;
	try {
		const result = await db.query("INSERT INTO resumes (user_id, file_name, file_path, parsed_data) VALUES ($1, $2, $3, $4) RETURNING *", [req.user.id, fileName, filePath, parsedData || null]);
		res.json({ resume: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all resumes for user
router.get("/", authenticate, async (req, res) => {
	try {
		const result = await db.query("SELECT * FROM resumes WHERE user_id = $1", [req.user.id]);
		res.json({ resumes: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
