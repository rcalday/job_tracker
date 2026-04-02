import express from "express";
import db from "../db.js"; // your PostgreSQL client
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/", async (req, res) => {
	try {
		const { name, username, email, password } = req.body;
		// hash the password before storing
		const salt = await bcrypt.genSalt(10);
		const hashedPass = await bcrypt.hash(password, salt);
		await db.query("INSERT INTO user_login (login_name, login_uname, login_upass, login_email) VALUES ($1, $2, $3, $4)", [name, username, hashedPass, email || null]);
		res.json({ message: "User registered successfully" });
	} catch (error) {
		if (error.code === "23505") {
			return res.status(409).json({ error: "Username already taken" });
		}
		res.status(500).json({ error: error.message });
	}
});

export default router;
