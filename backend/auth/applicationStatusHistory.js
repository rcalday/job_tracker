import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get status history for an application
router.get("/:applicationId", authenticate, async (req, res) => {
	try {
		const result = await db.query(`SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY changed_at DESC`, [req.params.applicationId]);
		res.json({ history: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
