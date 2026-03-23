import { useState } from "react";
import Sidebar from "../components/Sidebar";

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
			const res = await fetch(`http://localhost:3000/api/search?query=${encodeURIComponent(query)}`, {
				credentials: "include",
			});

			if (!res.ok) throw new Error("Search failed");

			const data = await res.json();
			setResults(data.jobs || []);
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Search failed");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container-fluid" style={{ minHeight: "100vh", background: "radial-gradient(circle at 15% 25%, #ffe7d1 20%, transparent 60%), radial-gradient(circle at 90% 80%, #cbe7e3 30%, transparent 70%), #f7f8fa" }}>
			<div className="row min-vh-100">
				{/* Sidebar */}
				<Sidebar />
				{/* Main Content */}
				<main className="col-12 col-md-9 col-lg-10 ms-sm-auto px-0 px-md-4 py-4 d-flex flex-column align-items-center">
					<div className="w-100" style={{ maxWidth: 900 }}>
						<h1 className="mb-4 fw-bold" style={{ fontFamily: "serif", fontSize: "2rem", color: "#36394b" }}>
							Job Search
						</h1>
						<form className="row g-3 mb-4" onSubmit={handleSearch}>
							<div className="col-12 col-md-8">
								<input type="text" className="form-control form-control-lg" placeholder="Search jobs..." value={query} onChange={(e) => setQuery(e.target.value)} required />
							</div>
							<div className="col-12 col-md-4">
								<button type="submit" className="btn btn-lg w-100 fw-semibold shadow-sm" style={{ fontSize: "1.1rem", borderRadius: "2rem", background: "linear-gradient(90deg, #21867a 60%, #1b6e6b 100%)", border: "none", color: "#fff" }} disabled={loading}>
									{loading ? "Searching..." : "Search"}
								</button>
							</div>
						</form>
						{error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
						<div className="table-responsive">
							<table className="table table-hover align-middle">
								<thead className="table-light">
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
												<a href={job.job_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
													View
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{!loading && results.length === 0 && <div className="text-center text-muted mt-3">No results found</div>}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
