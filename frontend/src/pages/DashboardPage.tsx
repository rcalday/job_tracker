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

import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetch("http://localhost:3000/auth/jobs", { credentials: "include" })
			.then((res) => res.json())
			.then((data) => setJobs(data.jobs || []))
			.catch(() => setError("Failed to load jobs"))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="dashboard-layout">
			<aside className="sidebar">
				<div className="sidebar-header">
					<span className="brand-logo">🔎</span>
					<span className="brand-title">Job Tracker</span>
				</div>
				<nav className="sidebar-nav">
					<ul>
						<li>
							<a href="/dashboard" className="active">
								Dashboard
							</a>
						</li>
						<li>
							<a href="/search">Job Search</a>
						</li>
						<li>
							<a
								href="/logout"
								onClick={(e) => {
									e.preventDefault();
									document.cookie = "accessToken=; Max-Age=0";
									document.cookie = "refreshToken=; Max-Age=0";
									window.location.href = "/login";
								}}>
								Logout
							</a>
						</li>
					</ul>
				</nav>
			</aside>
			<main className="dashboard-main">
				<h2>Job Search Results</h2>
				{loading ? (
					<div className="loading">Loading jobs...</div>
				) : error ? (
					<div className="error">{error}</div>
				) : (
					<div className="table-responsive">
						<table>
							<thead>
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
								{jobs.map((job) => (
									<tr key={job.id}>
										<td>{job.title}</td>
										<td>{job.company}</td>
										<td>{job.location}</td>
										<td>{job.source}</td>
										<td>{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : ""}</td>
										<td>
											<a href={job.job_url} target="_blank" rel="noopener noreferrer">
												View
											</a>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>
		</div>
	);
}
