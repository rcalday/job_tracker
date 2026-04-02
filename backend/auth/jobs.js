import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all jobs from DB, Google Jobs API, and Findwork API
import fetch from "node-fetch";

router.get("/", authenticate, async (req, res) => {
	try {
		const q = req.query.q || req.query.query || "developer";
		const location = req.query.location || "";
		const page = Math.max(1, parseInt(req.query.page) || 1);
		const nextPageToken = req.query.next_page_token || "";
		const limit = 10;

		// Fetch from Google Jobs API (using SerpAPI)
		let googleJobs = [];
		let googleError = null;
		let googleNextPageToken = null;
		try {
			const serpApiKey = process.env.SERPAPI_API_KEY?.replace(/^['"]|['"]$/g, "");
			if (!serpApiKey) {
				googleError = "SERPAPI_API_KEY is not set";
			} else {
				const serpQuery = location ? `${q} ${location}` : q;
				const serpParams = new URLSearchParams({
					engine: "google_jobs",
					q: serpQuery,
					api_key: serpApiKey,
				});
				if (nextPageToken) {
					serpParams.set("next_page_token", nextPageToken);
				}
				const googleResp = await fetch(`https://serpapi.com/search.json?${serpParams.toString()}`);
				const googleData = await googleResp.json();
				if (!googleResp.ok || googleData.error) {
					googleError = googleData.error || `HTTP ${googleResp.status}`;
					console.error("[SerpAPI] Error:", googleError);
				} else {
					googleJobs = googleData.jobs_results || [];
					googleNextPageToken = googleData.serpapi_pagination?.next_page_token || null;
				}
			}
		} catch (err) {
			googleError = err.message;
			console.error("[SerpAPI] Fetch failed:", err.message);
		}

		// Fetch from Findwork API
		let findworkJobs = [];
		try {
			const findworkApiKey = process.env.FINDWORK_API_KEY?.replace(/^['"]|['"]$/g, "");
			const findworkUrl = `https://findwork.dev/api/jobs/?search=${encodeURIComponent(q)}${location ? `&location=${encodeURIComponent(location)}` : ""}&page=${page}`;
			const findworkResp = await fetch(findworkUrl, {
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
			job_url: j.url,
			...j,
			source: "findwork",
		}));

		// Map Google jobs to consistent structure
		const mappedGoogleJobs = googleJobs.map((j) => ({
			title: j.title,
			company: j.company_name,
			location: j.location,
			job_url: j.related_links?.[0]?.link || "",
			description: j.description,
			...j,
			source: "google",
		}));

		const allJobs = [...mappedGoogleJobs, ...mappedFindworkJobs];

		// Filter out jobs the user has already applied to
		let appliedLinks = new Set();
		let appliedTitleCompany = new Set();
		try {
			const appsResult = await db.query("SELECT job_link, job_title, company FROM applications WHERE user_id = $1", [req.user.id]);
			for (const row of appsResult.rows) {
				if (row.job_link) appliedLinks.add(row.job_link.toLowerCase());
				appliedTitleCompany.add(`${(row.job_title || "").toLowerCase()}||${(row.company || "").toLowerCase()}`);
			}
		} catch (_err) {
			// Non-fatal — proceed without filtering
		}

		const filteredJobs = allJobs.filter((job) => {
			if (job.job_url && appliedLinks.has(job.job_url.toLowerCase())) return false;
			const tcKey = `${(job.title || "").toLowerCase()}||${(job.company || "").toLowerCase()}`;
			return !appliedTitleCompany.has(tcKey);
		});

		const hasMore = googleNextPageToken != null || findworkJobs.length >= limit;

		res.json({
			jobs: filteredJobs,
			page,
			hasMore,
			...(googleNextPageToken ? { nextPageToken: googleNextPageToken } : {}),
			...(googleError ? { googleError } : {}),
		});
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
