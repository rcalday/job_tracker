import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

interface Job {
	id: number;
	title: string;
	company: string;
	location: string;
	description: string;
	job_url: string;
	source: string;
	posted_at: string;
}

const DashboardPage = () => {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [weekCount, setWeekCount] = useState<number>(0);
	const [monthCount, setMonthCount] = useState<number>(0);
	const [yearCount, setYearCount] = useState<number>(0);

	useEffect(() => {
		// Fetch jobs and statistics here
		const fetchData = async () => {
			try {
				setLoading(true);
				setError("");
				// Replace with your actual API endpoints
				const jobsRes = await fetch("/api/applications");
				const jobsData = await jobsRes.json();
				setJobs(jobsData);

				const statsRes = await fetch("/api/applications/stats");
				const statsData = await statsRes.json();
				setWeekCount(statsData.week || 0);
				setMonthCount(statsData.month || 0);
				setYearCount(statsData.year || 0);
			} catch (err: any) {
				setError("Failed to load data");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	return (
		<div
			className="container-fluid"
			style={{
				minHeight: "100vh",
				background:
					"radial-gradient(circle at 15% 25%, #ffe7d1 20%, transparent 60%), radial-gradient(circle at 90% 80%, #cbe7e3 30%, transparent 70%), #f7f8fa",
			}}
		>
			<div className="row min-vh-100">
				{/* Sidebar */}
				<Sidebar />
				{/* Main Content */}
				<main className="col-12 col-md-9 col-lg-10 ms-sm-auto px-0 px-md-4 py-4 d-flex flex-column align-items-center">
					<div className="w-100" style={{ maxWidth: 900 }}>
						{/* Statistics */}
						<div className="row g-3 mb-4">
							<div className="col-12 col-md-4">
								<div className="bg-white rounded-4 shadow-sm p-4 text-center h-100">
									<div className="text-uppercase text-secondary small mb-1" style={{ letterSpacing: 1.2 }}>
										This Week
									</div>
									<div className="fw-bold display-6 text-primary">{weekCount}</div>
									<div className="text-muted">Applications</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="bg-white rounded-4 shadow-sm p-4 text-center h-100">
									<div className="text-uppercase text-secondary small mb-1" style={{ letterSpacing: 1.2 }}>
										This Month
									</div>
									<div className="fw-bold display-6 text-primary">{monthCount}</div>
									<div className="text-muted">Applications</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="bg-white rounded-4 shadow-sm p-4 text-center h-100">
									<div className="text-uppercase text-secondary small mb-1" style={{ letterSpacing: 1.2 }}>
										This Year
									</div>
									<div className="fw-bold display-6 text-primary">{yearCount}</div>
									<div className="text-muted">Applications</div>
								</div>
							</div>
						</div>
						{/* Table */}
						<div className="bg-white rounded-4 shadow-sm p-4">
							<h2
								className="mb-4 fw-bold"
								style={{ fontFamily: "serif", fontSize: "1.5rem", color: "#36394b", lineHeight: 1.1 }}
							>
								Your Job Applications
							</h2>
							{loading ? (
								<div className="text-center text-secondary py-4">Loading jobs...</div>
							) : error ? (
								<div className="alert alert-danger py-2 mb-3">{error}</div>
							) : (
								<div className="table-responsive">
									<table className="table table-hover align-middle">
										<thead className="table-light">
											<tr>
												<th>Title</th>
												<th>Company</th>
												<th>Location</th>
												<th>Source</th>
												<th>Posted</th>
												<th>Link</th>
											</tr>
										</thead>
										<tbody>
											{jobs.map((job: Job) => (
												<tr key={job.id}>
													<td>{job.title}</td>
													<td>{job.company}</td>
													<td>{job.location}</td>
													<td>{job.source}</td>
													<td>{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : ""}</td>
													<td>
														<a
															href={job.job_url}
															target="_blank"
															rel="noopener noreferrer"
															className="btn btn-outline-primary btn-sm"
														>
															View
														</a>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default DashboardPage;
