import { useEffect, useState } from "react";

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

	if (loading) return <div>Loading jobs...</div>;
	if (error) return <div>{error}</div>;

	return (
		<div className="dashboard-page">
			<h2>Job Search Results</h2>
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
	);
}
