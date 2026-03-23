import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";
// import dotenv from "dotenv";
const router = express.Router();

// dotenv.config();

router.post("/", async (req, res) => {
	const token = req.cookies.refreshToken || req.body?.refreshToken;
	if (!token) return res.status(401).json({ error: "Unauthorized" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
		const result = await db.query("SELECT * FROM user_login_refresh_tokens WHERE token=$1", [token]);
		if (!result.rows[0]) return res.status(403).json({ error: "Invalid token" });

		const rememberMe = decoded && typeof decoded === "object" && "rememberMe" in decoded ? decoded.rememberMe : false;
		const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
		const newRefreshToken = jwt.sign({ id: decoded.id, rememberMe }, process.env.JWT_REFRESH_SECRET, { expiresIn: rememberMe ? "30d" : "1d" });

		const tokenExpiryMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
		await db.query("UPDATE user_login_refresh_tokens SET token=$1, expires_at=$2 WHERE id=$3", [newRefreshToken, new Date(Date.now() + tokenExpiryMs), result.rows[0].id]);

		const cookieOptions = {
			httpOnly: true,
			secure: process.env.DEVELOPMENT === "false",
			sameSite: process.env.DEVELOPMENT === "false" ? "none" : "lax",
		};

		const refreshCookieOptions = { ...cookieOptions };
		if (rememberMe) {
			refreshCookieOptions.maxAge = tokenExpiryMs;
		}

		const accessCookieOptions = { ...cookieOptions };
		if (rememberMe) {
			accessCookieOptions.maxAge = 1000 * 60 * 15; // persistent for remember-me sessions
		}

		res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);
		res.cookie("accessToken", accessToken, accessCookieOptions);
		res.json({ message: "Token refreshed", accessToken, refreshToken: newRefreshToken });
	} catch (err) {
		res.status(403).json({ error: "Invalid token" });
	}
});

export default router;
