import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import JobDetailModal from "../components/JobDetailModal";
import type { ModalJob } from "../components/JobDetailModal";
import API from "../api";

interface Application {
	id: number;
	job_title: string;
	company: string;
	location: string;
	description: string;
	status: string;
	job_link: string;
	applied_at: string;
}

interface ChartPoint {
	date: string;
	count: number;
}

function statusClass(status: string) {
	switch (status) {
		case "Applied":
			return "badge badge-applied";
		case "Interview":
			return "badge badge-interview";
		case "Rejected":
			return "badge badge-rejected";
		case "Saved":
			return "badge badge-saved";
		default:
			return "badge badge-saved";
	}
}

export default function DashboardPage() {
	const { user } = useAuth();
	const [applications, setApplications] = useState<Application[]>([]);
	const [chartData, setChartData] = useState<ChartPoint[]>([]);
	const [weekCount, setWeekCount] = useState(0);
	const [monthCount, setMonthCount] = useState(0);
	const [yearCount, setYearCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalJob, setModalJob] = useState<ModalJob | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError("");

				const [statsRes, appsRes] = await Promise.all([API.get("/auth/applications/stats"), API.get("/auth/applications")]);

				setWeekCount(statsRes.data.week ?? 0);
				setMonthCount(statsRes.data.month ?? 0);
				setYearCount(statsRes.data.year ?? 0);
				setChartData(statsRes.data.chart ?? []);
				setApplications(appsRes.data.applications ?? []);
			} catch {
				setError("Failed to load data. Please try again.");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const firstName = user?.login_name?.split(" ")[0] ?? "there";

	return (
		<div style={{ maxWidth: 980, margin: "0 auto" }}>
			{/* Page header */}
			<div className="page-header">
				<h1 className="page-title">Welcome back, {firstName} 👋</h1>
				<p className="page-subtitle">Here's a summary of your job search activity.</p>
			</div>

			{/* Stat cards */}
			<div className="stat-grid" style={{ marginBottom: 24 }}>
				{[
					{ label: "This Week", value: weekCount, icon: "📅", color: "#4f46e5", bg: "#eef2ff" },
					{ label: "This Month", value: monthCount, icon: "📆", color: "#059669", bg: "#d1fae5" },
					{ label: "This Year", value: yearCount, icon: "🗓️", color: "#d97706", bg: "#fef3c7" },
				].map(({ label, value, icon, color, bg }) => (
					<div className="stat-card" key={label}>
						<div className="stat-icon-wrap" style={{ background: bg }}>
							<span style={{ fontSize: "1.2rem" }}>{icon}</span>
						</div>
						<div className="stat-label">{label}</div>
						<div className="stat-value" style={{ color }}>
							{value}
						</div>
						<div className="stat-sub">Applications</div>
					</div>
				))}
			</div>

			{/* Chart */}
			<div className="card" style={{ marginBottom: 24 }}>
				<div className="card-header">
					<span className="card-title">Applications — Last 30 Days</span>
				</div>
				<div className="card-body">
					{chartData.length > 0 ? (
						<div style={{ height: 220 }}>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
									<XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
									<YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
									<Tooltip
										contentStyle={{
											background: "var(--card)",
											border: "1px solid var(--border)",
											borderRadius: "var(--r-md)",
											boxShadow: "var(--shadow-md)",
											fontSize: "0.85rem",
										}}
									/>
									<Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Applications" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="empty-state" style={{ padding: "24px 0" }}>
							<p className="empty-title">No applications in the last 30 days yet.</p>
							<p className="empty-desc">Head to Search Jobs to start applying!</p>
						</div>
					)}
				</div>
			</div>

			{/* Recent applications table */}
			<div className="card">
				<div className="card-header">
					<span className="card-title">Recent Applications</span>
				</div>

				{loading ? (
					<div className="loading-center">
						<span className="spinner" />
						Loading...
					</div>
				) : error ? (
					<div className="card-body">
						<div className="alert alert-error">{error}</div>
					</div>
				) : applications.length === 0 ? (
					<div className="empty-state">
						<svg width="44" height="44" viewBox="0 0 16 16" fill="var(--text-muted)">
							<path d="M6 1a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V2a1 1 0 0 0-1-1H6zM5 3V2h6v1H5zm-1 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
						</svg>
						<p className="empty-title">No applications yet.</p>
						<p className="empty-desc">Try searching for jobs to get started!</p>
					</div>
				) : (
					<div className="table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Job Title</th>
									<th>Company</th>
									<th>Location</th>
									<th>Description</th>
									<th>Status</th>
									<th>Applied</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{applications.map((app) => (
									<tr key={app.id}>
										<td className="td-title">{app.job_title}</td>
										<td>{app.company || "—"}</td>
										<td className="td-muted">{app.location || "—"}</td>
										<td>
											{app.description ? (
												<span
													className="td-desc"
													title="Click to read full description"
													onClick={() =>
														setModalJob({
															title: app.job_title,
															company: app.company,
															description: app.description,
															job_url: app.job_link,
														})
													}>
													{app.description.length > 80 ? app.description.slice(0, 80) + "…" : app.description}
												</span>
											) : (
												<span className="td-muted">—</span>
											)}
										</td>
										<td>
											<span className={statusClass(app.status)}>{app.status}</span>
										</td>
										<td className="td-muted" style={{ whiteSpace: "nowrap" }}>
											{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "—"}
										</td>
										<td>
											{app.job_link && (
												<a href={app.job_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
													View ↗
												</a>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
		</div>
	);
}
