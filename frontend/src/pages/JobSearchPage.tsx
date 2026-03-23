import { useState } from "react";

export default function JobSearchPage() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			// This should call your backend endpoint that aggregates Google Jobs and Findwork
			const res = await fetch(`http://localhost:3000/api/search?query=${encodeURIComponent(query)}`, {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Search failed");
			const data = await res.json();
			setResults(data.jobs || []);
		} catch (err: any) {
			setError(err.message || "Search failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="job-search-page">
			<h2>Search Jobs</h2>
			<form onSubmit={handleSearch}>
				<input type="text" placeholder="Search jobs..." value={query} onChange={(e) => setQuery(e.target.value)} />
				<button type="submit" disabled={loading}>
					{loading ? "Searching..." : "Search"}
				</button>
			</form>
			{error && <div className="error">{error}</div>}
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Company</th>
						<th>Location</th>
						<th>Source</th>
						<th>Link</th>
					</tr>
				</thead>
				<tbody>
					{results.map((job, idx) => (
						<tr key={idx}>
							<td>{job.title}</td>
							<td>{job.company}</td>
							<td>{job.location}</td>
							<td>{job.source}</td>
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
