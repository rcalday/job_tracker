import express from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create a new application
router.post("/", authenticate, async (req, res) => {
	const { job_title, company, location, job_link, description, status, notes } = req.body;
	if (!job_title) return res.status(400).json({ error: "job_title is required" });
	try {
		const result = await db.query(
			`INSERT INTO applications (user_id, job_title, company, location, job_link, description, status, notes)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 ON CONFLICT (user_id, job_title, company) DO UPDATE
			   SET status = EXCLUDED.status, job_link = EXCLUDED.job_link,
			       description = EXCLUDED.description, notes = EXCLUDED.notes
			 RETURNING *`,
			[req.user.id, job_title, company || null, location || null, job_link || null, description || null, status || "Applied", notes || null],
		);
		res.json({ application: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get application statistics (week / month / year counts)
router.get("/stats", authenticate, async (req, res) => {
	try {
		const stats = await db.query(
			`SELECT
				COUNT(*) FILTER (WHERE applied_at >= date_trunc('week', NOW()))  AS week,
				COUNT(*) FILTER (WHERE applied_at >= date_trunc('month', NOW())) AS month,
				COUNT(*) FILTER (WHERE applied_at >= date_trunc('year', NOW()))  AS year
			 FROM applications WHERE user_id = $1`,
			[req.user.id],
		);
		const chart = await db.query(
			`SELECT to_char(date_trunc('day', applied_at), 'Mon DD') AS date, COUNT(*)::int AS count
			 FROM applications
			 WHERE user_id = $1 AND applied_at >= NOW() - INTERVAL '30 days'
			 GROUP BY date_trunc('day', applied_at), to_char(date_trunc('day', applied_at), 'Mon DD')
			 ORDER BY date_trunc('day', applied_at) ASC`,
			[req.user.id],
		);
		const row = stats.rows[0];
		res.json({
			week: parseInt(row.week) || 0,
			month: parseInt(row.month) || 0,
			year: parseInt(row.year) || 0,
			chart: chart.rows,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update application status
router.patch("/:id/status", authenticate, async (req, res) => {
	const { status } = req.body;
	try {
		const result = await db.query(`UPDATE applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *`, [status, req.params.id, req.user.id]);
		if (!result.rows[0]) return res.status(404).json({ error: "Application not found" });
		await db.query(`INSERT INTO application_status_history (application_id, status) VALUES ($1, $2)`, [req.params.id, status]);
		res.json({ application: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all applications for user — supports ?search=, ?status=, ?page=, ?limit=
router.get("/", authenticate, async (req, res) => {
	const search = (req.query.search ?? "").trim();
	const status = req.query.status ?? "";
	const pageNum = Math.max(1, parseInt(req.query.page) || 1);
	const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
	const offset = (pageNum - 1) * limitNum;

	const conditions = ["user_id = $1"];
	const params = [req.user.id];
	let p = 2;

	if (search) {
		conditions.push(`(job_title ILIKE $${p} OR company ILIKE $${p} OR location ILIKE $${p})`);
		params.push(`%${search}%`);
		p++;
	}

	if (status) {
		conditions.push(`status = $${p}`);
		params.push(status);
		p++;
	}

	const where = conditions.join(" AND ");

	try {
		const [countRes, dataRes] = await Promise.all([db.query(`SELECT COUNT(*) FROM applications WHERE ${where}`, params), db.query(`SELECT * FROM applications WHERE ${where} ORDER BY applied_at DESC LIMIT $${p} OFFSET $${p + 1}`, [...params, limitNum, offset])]);

		const total = parseInt(countRes.rows[0].count) || 0;
		res.json({
			applications: dataRes.rows,
			total,
			page: pageNum,
			totalPages: Math.ceil(total / limitNum) || 1,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
