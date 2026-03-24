import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js"; // your PostgreSQL client
import bcrypt from "bcrypt";

const router = express.Router();
let accessToken = null;

router.post("/", async (req, res) => {
	const { username, password, remember_me } = req.body;

	const user = await db.query("SELECT * FROM user_login WHERE login_uname=$1", [username]);

	if (!user.rows[0]) {
		return res.status(400).json({ error: "Invalid credentials" });
	}

	const valid = await bcrypt.compare(password, user.rows[0].login_upass);

	if (!valid) {
		return res.status(400).json({ error: "Invalid credentials" });
	}

	const accessToken = jwt.sign({ id: user.rows[0].login_id }, process.env.JWT_SECRET, { expiresIn: "15m" });
	const refreshToken = jwt.sign({ id: user.rows[0].login_id, rememberMe: remember_me }, process.env.JWT_REFRESH_SECRET, { expiresIn: remember_me ? "30d" : "1d" });

	// store refreshToken in DB
	const expiresAt = new Date(Date.now() + (remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
	await db.query("INSERT INTO user_login_refresh_tokens(user_id, token, expires_at) VALUES($1,$2,$3)", [user.rows[0].login_id, refreshToken, expiresAt]);

	const cookieOptions = {
		httpOnly: true,
		secure: process.env.DEVELOPMENT === "false",
		sameSite: process.env.DEVELOPMENT === "false" ? "none" : "lax",
	};

	const refreshCookieOptions = { ...cookieOptions };
	if (remember_me == true) {
		refreshCookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
	}

	res.cookie("refreshToken", refreshToken, refreshCookieOptions);

	const accessCookieOptions = { ...cookieOptions };
	if (remember_me) {
		accessCookieOptions.maxAge = 1000 * 60 * 15; // persistent for remember-me sessions
	}

	res.cookie("accessToken", accessToken, accessCookieOptions);

	// Only return user info, do not return tokens in JSON
	res.json({ name: user.rows[0].login_name });
});

export default router;
