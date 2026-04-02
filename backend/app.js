import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import loginRoute from "./auth/login.js";
import refreshRoute from "./auth/refresh.js";
import logoutRoute from "./auth/logout.js";
import meRoute from "./auth/me.js";
import registerRoute from "./auth/register.js";
import jobsRoute from "./auth/jobs.js";
import applicationsRoute from "./auth/applications.js";
import resumeRoute from "./auth/resume.js";
import searchSettingsRoute from "./auth/searchSettings.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Allow requests from your frontend
if (process.env.DEVELOPMENT === "false") {
	app.use(
		cors({
			origin: "https://jobtracker.carlosalday61.workers.dev",
			credentials: true,
		}),
	);
} else {
	app.use(
		cors({
			origin: "http://localhost:5173",
			credentials: true,
		}),
	);
}

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth/jobs", jobsRoute);
app.use("/api/search", jobsRoute);
app.use("/auth/register", registerRoute);
app.use("/auth/login", loginRoute);
app.use("/auth/refresh", refreshRoute);
app.use("/auth/logout", logoutRoute);
app.use("/auth/me", meRoute);
app.use("/auth/applications", applicationsRoute);
// app.use("/auth/resume", resumeRoute);
app.use("/auth/search-settings", searchSettingsRoute);

app.listen(3000, () => console.log("Server running on port 3000"));
