import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const DEFAULT_SETTINGS = { google: true, findwork: true, jooble: true };

// GET  /auth/search-settings  — load the current user's enabled sources
router.get("/", authenticate, async (req, res) => {
	try {
		const result = await db.query("SELECT enabled_sources FROM user_search_settings WHERE user_id = $1", [req.user.id]);
		res.json({ settings: result.rows[0]?.enabled_sources ?? DEFAULT_SETTINGS });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// PUT  /auth/search-settings  — save enabled sources for the current user
router.put("/", authenticate, async (req, res) => {
	const { enabled_sources } = req.body;
	if (!enabled_sources || typeof enabled_sources !== "object") {
		return res.status(400).json({ error: "enabled_sources object is required" });
	}
	// Validate only known keys to prevent arbitrary JSON storage
	const allowed = ["google", "findwork", "jooble"];
	const sanitized = Object.fromEntries(allowed.map((k) => [k, Boolean(enabled_sources[k])]));
	try {
		await db.query(
			`INSERT INTO user_search_settings (user_id, enabled_sources, updated_at)
			 VALUES ($1, $2::jsonb, NOW())
			 ON CONFLICT (user_id) DO UPDATE
			   SET enabled_sources = EXCLUDED.enabled_sources, updated_at = NOW()`,
			[req.user.id, JSON.stringify(sanitized)],
		);
		res.json({ success: true, settings: sanitized });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
