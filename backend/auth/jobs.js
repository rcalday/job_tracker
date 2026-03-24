import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all jobs from DB, Google Jobs API, and Findwork API
import fetch from "node-fetch";

router.get("/", authenticate, async (req, res) => {
	try {
		// Fetch from local DB

		// Fetch from Google Jobs API (using SerpAPI)
		let googleJobs = [];
		try {
			const serpApiKey = process.env.SERPAPI_API_KEY?.replace(/^['"]|['"]$/g, "");
			const googleResp = await fetch(`https://serpapi.com/search.json?engine=google_jobs&q=developer&api_key=${serpApiKey}`);
			if (googleResp.ok) {
				const googleData = await googleResp.json();
				// Adapt this mapping to the actual SerpAPI Google Jobs response structure
				if (googleData.jobs_results) {
					googleJobs = googleData.jobs_results;
				}
			}
		} catch (err) {
			// Ignore Google Jobs API errors, log if needed
		}

		// Fetch from Findwork API
		let findworkJobs = [];
		try {
			const findworkApiKey = process.env.FINDWORK_API_KEY?.replace(/^['"]|['"]$/g, "");
			const findworkResp = await fetch("https://findwork.dev/api/jobs/?search=developer", {
				headers: {
					Authorization: `Token ${findworkApiKey}`,
				},
			});
			if (findworkResp.ok) {
				const findworkData = await findworkResp.json();
				findworkJobs = findworkData.results || [];
			}
		} catch (err) {
			// Ignore Findwork API errors, log if needed
		}

		// Map Findwork jobs to consistent structure
		const mappedFindworkJobs = findworkJobs.map((j) => ({
			title: j.role,
			company: j.company_name,
			location: j.location,
			...j,
			source: "findwork",
		}));

		// Merge all jobs into a single array
		const allJobs = [...googleJobs.map((j) => ({ ...j, source: "google" })), ...mappedFindworkJobs];

		res.json({ jobs: allJobs });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get a single job by id
router.get("/:id", authenticate, async (req, res) => {
	try {
		const result = await db.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
		if (!result.rows[0]) return res.status(404).json({ error: "Job not found" });
		res.json({ job: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
