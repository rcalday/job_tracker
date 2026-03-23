import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new application
router.post("/", authenticate, async (req, res) => {
	const { jobId, resumeId, status, notes } = req.body;
	try {
		const result = await db.query(`INSERT INTO applications (user_id, job_id, resume_id, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [req.user.id, jobId, resumeId || null, status || "Applied", notes || null]);
		res.json({ application: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update application status
router.patch("/:id/status", authenticate, async (req, res) => {
	const { status } = req.body;
	try {
		const result = await db.query(`UPDATE applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *`, [status, req.params.id, req.user.id]);
		if (!result.rows[0]) return res.status(404).json({ error: "Application not found" });
		// Optionally, insert into status history
		await db.query(`INSERT INTO application_status_history (application_id, status) VALUES ($1, $2)`, [req.params.id, status]);
		res.json({ application: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all applications for user
router.get("/", authenticate, async (req, res) => {
	try {
		const result = await db.query(`SELECT * FROM applications WHERE user_id = $1`, [req.user.id]);
		res.json({ applications: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
