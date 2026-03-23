import express from "express";
import cookieParser from "cookie-parser";
import loginRoute from "./auth/login.js";
import refreshRoute from "./auth/refresh.js";
import logoutRoute from "./auth/logout.js";
import meRoute from "./auth/me.js";
import registerRoute from "./auth/register.js";
import jobsRoute from "./auth/jobs.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const app = express();
// Allow requests from your frontend
if (process.env.DEVELOPMENT === "false") {
	app.use(
		cors({
			origin: "https://reactlogin.carlosalday61.workers.dev", // NO trailing slash
			credentials: true,
		}),
	);
} else {
	app.use(
		cors({
			origin: "http://localhost:5173", // NO trailing slash
			credentials: true,
		}),
	);
}

app.use(express.json());
app.use(cookieParser());

app.use("/auth/jobs", jobsRoute);
app.use("/auth/register", registerRoute);
app.use("/auth/login", loginRoute);
app.use("/auth/refresh", refreshRoute);
app.use("/auth/logout", logoutRoute);
app.use("/auth/me", meRoute);

app.listen(3000, () => console.log("Server running on port 3000"));
