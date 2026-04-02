import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import JobDetailModal from "../components/JobDetailModal";
import type { ModalJob } from "../components/JobDetailModal";

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

const STATUS_COLORS: Record<string, string> = {
	Applied: "primary",
	Interview: "success",
	Rejected: "danger",
	Saved: "secondary",
};

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

				const [statsRes, appsRes] = await Promise.all([fetch("http://localhost:3000/auth/applications/stats", { credentials: "include" }), fetch("http://localhost:3000/auth/applications", { credentials: "include" })]);

				if (statsRes.ok) {
					const statsData = await statsRes.json();
					setWeekCount(statsData.week ?? 0);
					setMonthCount(statsData.month ?? 0);
					setYearCount(statsData.year ?? 0);
					setChartData(statsData.chart ?? []);
				}

				if (appsRes.ok) {
					const appsData = await appsRes.json();
					setApplications(appsData.applications ?? []);
				}
			} catch {
				setError("Failed to load data. Please try again.");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	return (
		<div style={{ maxWidth: 960, margin: "0 auto" }}>
			{/* Header */}
			<div className="mb-4">
				<h1 className="fw-bold mb-1" style={{ fontSize: "1.7rem", color: "#36394b" }}>
					Welcome back, {user?.login_name?.split(" ")[0]} 👋
				</h1>
				<p className="text-muted mb-0">Here's a summary of your job search activity.</p>
			</div>

			{/* Stat Cards */}
			<div className="row g-3 mb-4">
				{[
					{ label: "This Week", value: weekCount, color: "#21867a" },
					{ label: "This Month", value: monthCount, color: "#1b6e6b" },
					{ label: "This Year", value: yearCount, color: "#145c59" },
				].map(({ label, value, color }) => (
					<div className="col-12 col-sm-4" key={label}>
						<div className="bg-white rounded-4 shadow-sm p-4 text-center h-100 border">
							<div className="text-uppercase text-muted small mb-2 fw-semibold" style={{ letterSpacing: 1 }}>
								{label}
							</div>
							<div className="fw-bold" style={{ fontSize: "2.8rem", lineHeight: 1, color }}>
								{value}
							</div>
							<div className="text-muted mt-1" style={{ fontSize: "0.88rem" }}>
								Applications
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Chart */}
			<div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
				<h2 className="fw-semibold mb-3" style={{ fontSize: "1.1rem", color: "#36394b" }}>
					Applications — Last 30 Days
				</h2>
				{chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height={220}>
						<BarChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
							<XAxis dataKey="date" tick={{ fontSize: 11 }} />
							<YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
							<Tooltip />
							<Bar dataKey="count" fill="#21867a" radius={[4, 4, 0, 0]} name="Applications" />
						</BarChart>
					</ResponsiveContainer>
				) : (
					<div className="text-center text-muted py-4" style={{ fontSize: "0.95rem" }}>
						No applications in the last 30 days yet. Start applying!
					</div>
				)}
			</div>

			{/* Applications Table */}
			<div className="bg-white rounded-4 shadow-sm p-4 border">
				<h2 className="fw-semibold mb-3" style={{ fontSize: "1.1rem", color: "#36394b" }}>
					Recent Applications
				</h2>

				{loading ? (
					<div className="text-center text-secondary py-4">Loading...</div>
				) : error ? (
					<div className="alert alert-danger py-2">{error}</div>
				) : applications.length === 0 ? (
					<div className="text-center text-muted py-4">No applications yet. Try searching for jobs!</div>
				) : (
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead className="table-light">
								<tr>
									<th>Job Title</th>
									<th>Company</th>
									<th>Location</th>
									<th>
										Description{" "}
										<span className="text-muted fw-normal" style={{ fontSize: "0.78rem" }}>
											(click to expand)
										</span>
									</th>
									<th>Status</th>
									<th>Applied</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{applications.map((app) => (
									<tr key={app.id}>
										<td className="fw-medium">{app.job_title}</td>
										<td>{app.company || "—"}</td>
										<td>{app.location || "—"}</td>
										<td>
											{app.description ? (
												<span
													className="text-muted"
													style={{ fontSize: "0.83rem", cursor: "pointer" }}
													title="Click to read full description"
													onClick={() =>
														setModalJob({
															title: app.job_title,
															company: app.company,
															description: app.description,
															job_url: app.job_link,
														})
													}>
													{app.description.length > 90 ? app.description.slice(0, 90) + "…" : app.description}
												</span>
											) : (
												<span className="text-muted" style={{ fontSize: "0.83rem" }}>
													—
												</span>
											)}
										</td>
										<td>
											<span className={`badge bg-${STATUS_COLORS[app.status] ?? "secondary"}`}>{app.status}</span>
										</td>
										<td style={{ fontSize: "0.85rem" }}>{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "—"}</td>
										<td>
											{app.job_link && (
												<a href={app.job_link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">
													View
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

			{/* Job Detail Modal */}
			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
		</div>
	);
}
