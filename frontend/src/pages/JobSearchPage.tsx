import { useState } from "react";
import JobDetailModal from "../components/JobDetailModal";

interface Job {
	title: string;
	company: string;
	location: string;
	job_url: string;
	source: string;
	description?: string;
}

function truncate(text: string | undefined, max = 90): string {
	if (!text) return "—";
	return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function JobSearchPage() {
	const [query, setQuery] = useState("");
	const [location, setLocation] = useState("");
	const [results, setResults] = useState<Job[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [nextPageToken, setNextPageToken] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [savingKey, setSavingKey] = useState<string | null>(null);
	const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
	const [saveError, setSaveError] = useState("");
	const [googleError, setGoogleError] = useState("");
	const [modalJob, setModalJob] = useState<Job | null>(null);

	const fetchJobs = async (page: number, q: string, loc: string, pageToken = "") => {
		setLoading(true);
		setError("");
		setSaveError("");
		setGoogleError("");
		setResults([]);
		setSavedKeys(new Set());

		try {
			const params = new URLSearchParams({ query: q.trim(), page: String(page) });
			if (loc.trim()) params.set("location", loc.trim());
			if (pageToken) params.set("next_page_token", pageToken);

			const res = await fetch(`http://localhost:3000/api/search?${params.toString()}`, {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Search failed");

			const data = await res.json();
			setResults(data.jobs ?? []);
			setHasMore(data.hasMore ?? false);
			setNextPageToken(data.nextPageToken ?? "");
			if (data.googleError) setGoogleError(`Google Jobs unavailable: ${data.googleError}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Search failed");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		setNextPageToken("");
		fetchJobs(1, query, location, "");
	};

	const handlePageChange = (newPage: number) => {
		const token = newPage > currentPage ? nextPageToken : "";
		setCurrentPage(newPage);
		fetchJobs(newPage, query, location, token);
	};

	const jobKey = (job: Job) => `${job.title}||${job.company}`;

	const handleOpenJob = async (job: Job) => {
		const key = jobKey(job);
		setSavingKey(key);
		setSaveError("");

		try {
			const res = await fetch("http://localhost:3000/auth/applications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					job_title: job.title,
					company: job.company || null,
					location: job.location || null,
					job_link: job.job_url || null,
					description: job.description || null,
					status: "Applied",
				}),
			});

			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error((d as { error?: string }).error || "Failed to save application");
			}

			setSavedKeys((prev) => new Set(prev).add(key));
			setResults((prev) => prev.filter((j) => jobKey(j) !== key));
			if (job.job_url) {
				window.open(job.job_url, "_blank", "noopener,noreferrer");
			}
		} catch (err: unknown) {
			setSaveError(err instanceof Error ? err.message : "Failed to save application");
		} finally {
			setSavingKey(null);
		}
	};

	return (
		<div style={{ maxWidth: 1100, margin: "0 auto" }}>
			<h1 className="fw-bold mb-1" style={{ fontSize: "1.7rem", color: "#36394b" }}>
				Search Jobs
			</h1>
			<p className="text-muted mb-4">Find job listings from Google Jobs and Findwork.</p>

			{/* Search form */}
			<form className="row g-2 mb-4 align-items-end" onSubmit={handleSearch}>
				<div className="col-12 col-md-5">
					<label className="form-label fw-semibold small">Job Title / Keywords</label>
					<input type="text" className="form-control" placeholder="e.g. Frontend Developer" value={query} onChange={(e) => setQuery(e.target.value)} required />
				</div>
				<div className="col-12 col-md-4">
					<label className="form-label fw-semibold small">Location</label>
					<input type="text" className="form-control" placeholder="e.g. New York, Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
				</div>
				<div className="col-12 col-md-3">
					<button
						type="submit"
						className="btn w-100 fw-semibold"
						style={{
							background: "linear-gradient(90deg, #21867a 60%, #1b6e6b 100%)",
							border: "none",
							color: "#fff",
							borderRadius: "0.5rem",
						}}
						disabled={loading}>
						{loading ? (
							<>
								<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
								Searching...
							</>
						) : (
							"Search"
						)}
					</button>
				</div>
			</form>

			{error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
			{saveError && <div className="alert alert-danger py-2 mb-3">{saveError}</div>}
			{googleError && <div className="alert alert-warning py-2 mb-3">⚠️ {googleError}</div>}

			<div className="bg-white rounded-4 shadow-sm border">
				<div className="table-responsive">
					<table className="table table-hover align-middle mb-0">
						<thead className="table-light">
							<tr>
								<th style={{ minWidth: 160 }}>Job Title</th>
								<th style={{ minWidth: 120 }}>Company</th>
								<th style={{ minWidth: 110 }}>Location</th>
								<th style={{ minWidth: 200 }}>
									Description{" "}
									<span className="text-muted fw-normal" style={{ fontSize: "0.78rem" }}>
										(click to expand)
									</span>
								</th>
								<th>Source</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{results.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center text-muted py-5">
										{currentPage > 1 ? "No results on this page." : "Search for jobs to see results."}
									</td>
								</tr>
							) : (
								results.map((job, idx) => {
									const key = jobKey(job);
									const saved = savedKeys.has(key);
									return (
										<tr key={idx}>
											<td className="fw-medium">{job.title}</td>
											<td>{job.company || "—"}</td>
											<td>{job.location || "—"}</td>
											<td>
												{job.description ? (
													<span className="text-muted" style={{ fontSize: "0.83rem", cursor: "pointer" }} title="Click to read full description" onClick={() => setModalJob(job)}>
														{truncate(job.description)}
													</span>
												) : (
													<span className="text-muted" style={{ fontSize: "0.83rem" }}>
														—
													</span>
												)}
											</td>
											<td>
												<span className="badge bg-light text-secondary border" style={{ fontSize: "0.78rem" }}>
													{job.source}
												</span>
											</td>
											<td>
												<button className={`btn btn-sm ${saved ? "btn-success" : "btn-outline-primary"}`} disabled={savingKey === key} onClick={() => handleOpenJob(job)}>
													{savingKey === key ? (
														<>
															<span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
															Saving...
														</>
													) : saved ? (
														"Applied ✓"
													) : (
														"Open Job"
													)}
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{(results.length > 0 || currentPage > 1) && (
					<div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
						<span className="text-muted small">
							Page {currentPage} &mdash; {results.length} result{results.length !== 1 ? "s" : ""}
						</span>
						<nav>
							<ul className="pagination pagination-sm mb-0">
								<li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
									<button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={loading}>
										&laquo; Prev
									</button>
								</li>
								<li className="page-item active">
									<span className="page-link">{currentPage}</span>
								</li>
								<li className={`page-item${!hasMore ? " disabled" : ""}`}>
									<button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={loading}>
										Next &raquo;
									</button>
								</li>
							</ul>
						</nav>
					</div>
				)}
			</div>

			{/* Job Detail Modal */}
			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} onOpenJob={() => handleOpenJob(modalJob)} />}
		</div>
	);
}
