import express from "express";
import { authenticate } from "../middleware/auth.js";
import db from "../db.js";
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
	const user = await db.query("SELECT login_id,login_uname FROM user_login WHERE login_id=$1", [req.user.id]);
	res.json({ user: user.rows[0] });
});

export default router;
