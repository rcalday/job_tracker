import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

import fetch from "node-fetch";

// GET /api/search  — fetch jobs from enabled sources
router.get("/", authenticate, async (req, res) => {
	try {
		const q = (req.query.q || req.query.query || "developer").trim();
		// Normalize location: trim and lowercase for consistent API requests
		const location = (req.query.location || "").trim().toLowerCase();
		const page = Math.max(1, parseInt(req.query.page) || 1);
		const nextPageToken = req.query.next_page_token || "";
		const limit = 10;

		// Which sources to query — prefer explicit query param; fall back to user's saved DB settings
		let enabledSources;
		if (req.query.sources) {
			enabledSources = new Set(req.query.sources.split(",").map((s) => s.trim().toLowerCase()));
		} else {
			try {
				const settingsResult = await db.query("SELECT enabled_sources FROM user_search_settings WHERE user_id = $1", [req.user.id]);
				const saved = settingsResult.rows[0]?.enabled_sources ?? { google: true, findwork: true, jooble: true };
				enabledSources = new Set(
					Object.entries(saved)
						.filter(([, v]) => v)
						.map(([k]) => k),
				);
			} catch {
				enabledSources = new Set(["google", "findwork", "jooble"]);
			}
		}

		// ── Google Jobs via SerpAPI ──────────────────────────────────────────
		let googleJobs = [];
		let googleError = null;
		let googleNextPageToken = null;

		if (enabledSources.has("google")) {
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
					if (nextPageToken) serpParams.set("next_page_token", nextPageToken);

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
		}

		// ── Findwork API ─────────────────────────────────────────────────────
		let findworkJobs = [];

		if (enabledSources.has("findwork")) {
			try {
				const findworkApiKey = process.env.FINDWORK_API_KEY?.replace(/^['"]|['"]$/g, "");
				const locParam = location ? `&location=${encodeURIComponent(location)}` : "";
				const findworkUrl = `https://findwork.dev/api/jobs/?search=${encodeURIComponent(q)}${locParam}&page=${page}`;
				const findworkResp = await fetch(findworkUrl, {
					headers: { Authorization: `Token ${findworkApiKey}` },
				});
				if (findworkResp.ok) {
					const findworkData = await findworkResp.json();
					findworkJobs = findworkData.results || [];
				}
			} catch (err) {
				console.error("[Findwork] Fetch failed:", err.message);
			}
		}

		// ── Jooble API ───────────────────────────────────────────────────────
		let joobleJobs = [];
		let joobleError = null;

		if (enabledSources.has("jooble")) {
			try {
				const joobleApiKey = process.env.JOOBLE_API_KEY?.replace(/^['"']|['"']$/g, "");
				if (!joobleApiKey) {
					joobleError = "JOOBLE_API_KEY is not set";
				} else {
					const joobleResp = await fetch(`https://jooble.org/api/${joobleApiKey}`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ keywords: q, location: location || "", page }),
					});
					if (joobleResp.ok) {
						const joobleData = await joobleResp.json();
						joobleJobs = joobleData.jobs || [];
					} else {
						joobleError = `HTTP ${joobleResp.status}`;
						console.error("[Jooble] Error:", joobleError);
					}
				}
			} catch (err) {
				joobleError = err.message;
				console.error("[Jooble] Fetch failed:", err.message);
			}
		}

		// ── Normalize to shared structure ────────────────────────────────────

		const mappedGoogleJobs = googleJobs.map((j) => ({
			title: j.title,
			company: j.company_name,
			location: j.location,
			job_url: j.related_links?.[0]?.link || "",
			description: j.description || null,
			source: "google",
		}));

		const mappedFindworkJobs = findworkJobs.map((j) => {
			// Findwork doesn't provide full descriptions — compose one from available fields
			const parts = [];
			if (Array.isArray(j.keywords) && j.keywords.length) parts.push(`Skills: ${j.keywords.join(", ")}`);
			if (j.remote === true) parts.push("Remote: Yes");
			else if (j.remote === false) parts.push("Remote: No");
			if (j.date_posted) parts.push(`Posted: ${j.date_posted}`);
			return {
				title: j.role,
				company: j.company_name,
				location: j.location || "",
				job_url: j.url,
				description: parts.length ? parts.join("  ·  ") : null,
				source: "findwork",
			};
		});

		const mappedJoobleJobs = joobleJobs.map((j) => ({
			title: j.title,
			company: j.company,
			location: j.location || "",
			job_url: j.link,
			description: j.snippet
				? j.snippet
						.replace(/<[^>]+>/g, " ")
						.replace(/\s{2,}/g, " ")
						.trim()
						.slice(0, 800)
				: null,
			source: "jooble",
		}));

		const allJobs = [...mappedGoogleJobs, ...mappedFindworkJobs, ...mappedJoobleJobs];

		// ── Filter already-applied jobs ──────────────────────────────────────
		const appliedLinks = new Set();
		const appliedTitleCompany = new Set();
		try {
			const appsResult = await db.query("SELECT job_link, job_title, company FROM applications WHERE user_id = $1 AND status != 'Saved'", [req.user.id]);
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

		const hasMore = googleNextPageToken != null || findworkJobs.length >= limit || joobleJobs.length >= limit;

		res.json({
			jobs: filteredJobs,
			page,
			hasMore,
			...(googleNextPageToken ? { nextPageToken: googleNextPageToken } : {}),
			...(googleError ? { googleError } : {}),
			...(joobleError ? { joobleError } : {}),
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
