import express from "express";
import { authenticate } from "../middleware/auth.js";
import db from "../db.js";
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
	try {
		const user = await db.query("SELECT login_id, login_name, login_uname, login_email FROM user_login WHERE login_id=$1", [req.user.id]);
		if (!user.rows[0]) return res.status(404).json({ error: "User not found" });
		res.json({ user: user.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
