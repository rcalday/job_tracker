import express from "express";
import db from "../db.js"; // your PostgreSQL client
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/", async (req, res) => {
	try {
		const { name, username, password } = req.body;
		// hash the password before storing
		const salt = await bcrypt.genSalt(10);
		const hashedPass = await bcrypt.hash(password, salt);
		await db.query("INSERT INTO user_login (login_name, login_uname, login_upass) VALUES ($1, $2, $3)", [name, username, hashedPass]);
		res.json("User registered successfully");
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

export default router;
