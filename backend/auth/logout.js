import express from "express";
import db from "../db.js";
const router = express.Router();

router.post("/", async (req, res) => {
	const token = req.cookies.refreshToken || req.body?.refreshToken;
	if (token) {
		await db.query("DELETE FROM user_login_refresh_tokens WHERE token=$1", [token]);
	}
	const cookieOptions = {
		httpOnly: true,
		secure: process.env.DEVELOPMENT === "false",
		sameSite: process.env.DEVELOPMENT === "false" ? "none" : "lax",
	};
	res.clearCookie("refreshToken", cookieOptions);
	res.clearCookie("accessToken", cookieOptions);
	res.json({ message: "Logged out" });
});

export default router;
