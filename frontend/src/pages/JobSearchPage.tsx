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
	const [searched, setSearched] = useState(false);

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
		setSearched(true);
		fetchJobs(1, query, location, "");
	};

	const handlePageChange = (newPage: number) => {
		const token = newPage > currentPage ? nextPageToken : "";
		setCurrentPage(newPage);
		fetchJobs(newPage, query, location, token);
		window.scrollTo({ top: 0, behavior: "smooth" });
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
			{/* Page header */}
			<div className="page-header">
				<h1 className="page-title">Search Jobs</h1>
				<p className="page-subtitle">Find job listings from Google Jobs and Findwork.</p>
			</div>

			{/* Search form */}
			<div className="card" style={{ marginBottom: 20 }}>
				<div className="card-body">
					<form onSubmit={handleSearch}>
						<div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
							<div className="form-group" style={{ flex: "2 1 220px", marginBottom: 0 }}>
								<label className="form-label">Job Title / Keywords</label>
								<div className="search-wrap">
									<svg className="search-icon" width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
										<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
									</svg>
									<input type="text" className="form-input" placeholder="e.g. Frontend Developer, Data Analyst" value={query} onChange={(e) => setQuery(e.target.value)} required />
								</div>
							</div>
							<div className="form-group" style={{ flex: "1 1 180px", marginBottom: 0 }}>
								<label className="form-label">Location</label>
								<input type="text" className="form-input" placeholder="e.g. New York, Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
							</div>
							<div style={{ flexShrink: 0, paddingBottom: 1 }}>
								<button type="submit" className="btn btn-primary" style={{ height: 42 }} disabled={loading}>
									{loading ? (
										<>
											<span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} /> Searching...
										</>
									) : (
										<>
											<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
												<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
											</svg>
											Search
										</>
									)}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>

			{/* Alerts */}
			{error && <div className="alert alert-error">{error}</div>}
			{saveError && <div className="alert alert-error">{saveError}</div>}
			{googleError && <div className="alert alert-warning">âš ï¸ {googleError}</div>}

			{/* Results */}
			<div className="card">
				{!searched ? (
					<div className="empty-state">
						<svg width="48" height="48" viewBox="0 0 16 16" fill="var(--text-muted)">
							<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
						</svg>
						<p className="empty-title">Search for jobs above</p>
						<p className="empty-desc">Enter a job title or keywords to find open positions.</p>
					</div>
				) : loading ? (
					<div className="loading-center">
						<span className="spinner-lg spinner" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
						Searching for jobs...
					</div>
				) : results.length === 0 ? (
					<div className="empty-state">
						<svg width="44" height="44" viewBox="0 0 16 16" fill="var(--text-muted)">
							<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
						</svg>
						<p className="empty-title">No results found</p>
						<p className="empty-desc">Try different keywords or a broader location.</p>
					</div>
				) : (
					<>
						<div className="table-wrap">
							<table className="data-table">
								<thead>
									<tr>
										<th style={{ minWidth: 160 }}>Job Title</th>
										<th style={{ minWidth: 120 }}>Company</th>
										<th style={{ minWidth: 110 }}>Location</th>
										<th style={{ minWidth: 200 }}>Description</th>
										<th>Source</th>
										<th style={{ minWidth: 110 }}></th>
									</tr>
								</thead>
								<tbody>
									{results.map((job, idx) => {
										const key = jobKey(job);
										const saved = savedKeys.has(key);
										return (
											<tr key={idx}>
												<td className="td-title">{job.title}</td>
												<td>{job.company || "—"}</td>
												<td className="td-muted">{job.location || "—"}</td>
												<td>
													{job.description ? (
														<span className="td-desc" title="Click to read full description" onClick={() => setModalJob(job)}>
															{truncate(job.description)}
														</span>
													) : (
														<span className="td-muted">—</span>
													)}
												</td>
												<td>
													<span className="badge badge-source">{job.source}</span>
												</td>
												<td>
													{saved ? (
														<span className="btn btn-applied btn-sm" style={{ cursor: "default", pointerEvents: "none" }}>
															âœ“ Applied
														</span>
													) : (
														<button className="btn btn-primary btn-sm" disabled={savingKey === key} onClick={() => handleOpenJob(job)}>
															{savingKey === key ? (
																<>
																	<span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff", width: 12, height: 12 }} /> Saving...
																</>
															) : (
																"Apply ↗"
															)}
														</button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						<div className="pagination-bar">
							<span className="pagination-info">
								Page {currentPage} Â· {results.length} result{results.length !== 1 ? "s" : ""}
							</span>
							<div className="pagination-controls">
								<button className="pg-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>
									‹ Prev
								</button>
								<button className="pg-btn pg-active">{currentPage}</button>
								<button className="pg-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={!hasMore || loading}>
									Next ›
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} onOpenJob={() => handleOpenJob(modalJob)} />}
		</div>
	);
}
