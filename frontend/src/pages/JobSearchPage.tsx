import { useState, useEffect } from "react";
import JobDetailModal from "../components/JobDetailModal";
import API from "../api";
import type { AxiosError } from "axios";

interface Job {
	title: string;
	company: string;
	location: string;
	job_url: string;
	source: string;
	description?: string;
}

interface SearchSettings {
	google: boolean;
	findwork: boolean;
	jooble: boolean;
}

const DEFAULT_SETTINGS: SearchSettings = { google: true, findwork: true, jooble: true };

const SOURCE_LABELS: Record<string, string> = {
	google: "Google Jobs",
	findwork: "FindWork",
	jooble: "Jooble",
};

function sourceBadgeClass(source: string) {
	switch (source) {
		case "google":
			return "badge badge-source badge-source-google";
		case "findwork":
			return "badge badge-source badge-source-findwork";
		case "jooble":
			return "badge badge-source badge-source-jooble";
		default:
			return "badge badge-source";
	}
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
	const [joobleError, setJoobleError] = useState("");
	const [modalJob, setModalJob] = useState<Job | null>(null);
	const [searched, setSearched] = useState(false);
	const [pageSize, setPageSize] = useState<number>(10);
	const [clientPage, setClientPage] = useState(1);

	// Search settings
	const [settings, setSettings] = useState<SearchSettings>(DEFAULT_SETTINGS);
	const [showSettings, setShowSettings] = useState(false);
	const [draftSettings, setDraftSettings] = useState<SearchSettings>(DEFAULT_SETTINGS);
	const [settingsSaving, setSettingsSaving] = useState(false);
	const [settingsError, setSettingsError] = useState("");

	const PAGE_SIZES = [10, 50, 100] as const;

	// Load saved settings on mount
	useEffect(() => {
		API.get("/auth/search-settings")
			.then((r) => r.data)
			.then((data) => {
				if (data?.settings) {
					setSettings(data.settings);
					setDraftSettings(data.settings);
				}
			})
			.catch(() => {});
	}, []);

	const buildSourcesParam = (s: SearchSettings) => (Object.keys(s) as (keyof SearchSettings)[]).filter((k) => s[k]).join(",") || "google";

	const fetchJobs = async (page: number, q: string, loc: string, pageToken = "", src = settings) => {
		setLoading(true);
		setError("");
		setSaveError("");
		setGoogleError("");
		setJoobleError("");
		setResults([]);
		setSavedKeys(new Set());
		setClientPage(1);

		try {
			const params = new URLSearchParams({ query: q.trim(), page: String(page) });
			if (loc.trim()) params.set("location", loc.trim());
			if (pageToken) params.set("next_page_token", pageToken);
			params.set("sources", buildSourcesParam(src));

			const res = await API.get(`/api/search?${params.toString()}`);
			setResults(res.data.jobs ?? []);
			setHasMore(res.data.hasMore ?? false);
			setNextPageToken(res.data.nextPageToken ?? "");
			if (res.data.googleError) setGoogleError(`Google Jobs unavailable: ${res.data.googleError}`);
			if (res.data.joobleError) setJoobleError(`Jooble unavailable: ${res.data.joobleError}`);
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
		fetchJobs(1, query, location, "", settings);
	};

	const handlePageChange = (newPage: number) => {
		const token = newPage > currentPage ? nextPageToken : "";
		setCurrentPage(newPage);
		fetchJobs(newPage, query, location, token, settings);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const jobKey = (job: Job) => `${job.title}||${job.company}`;

	const totalClientPages = Math.ceil(results.length / pageSize);
	const displayedResults = results.slice((clientPage - 1) * pageSize, clientPage * pageSize);

	const handleOpenJob = async (job: Job) => {
		const key = jobKey(job);
		setSavingKey(key);
		setSaveError("");

		try {
			const res = await API.post("/auth/applications", {
				job_title: job.title,
				company: job.company || null,
				location: job.location || null,
				job_link: job.job_url || null,
				description: job.description || null,
				status: "Applied",
			});
			void res;

			setSavedKeys((prev) => new Set(prev).add(key));
			setResults((prev) => prev.filter((j) => jobKey(j) !== key));
			if (job.job_url) {
				window.open(job.job_url, "_blank", "noopener,noreferrer");
			}
		} catch (err: unknown) {
			const axiosErr = err as AxiosError<{ error?: string }>;
			setSaveError(axiosErr.response?.data?.error ?? (err instanceof Error ? err.message : "Failed to save application"));
		} finally {
			setSavingKey(null);
		}
	};

	const openSettings = () => {
		setDraftSettings({ ...settings });
		setSettingsError("");
		setShowSettings(true);
	};

	const saveSettings = async () => {
		setSettingsSaving(true);
		setSettingsError("");
		try {
			await API.put("/auth/search-settings", { enabled_sources: draftSettings });
			setSettings(draftSettings);
			setShowSettings(false);
		} catch (err: unknown) {
			const axiosErr = err as AxiosError<{ error?: string }>;
			setSettingsError(axiosErr.response?.data?.error ?? (err instanceof Error ? err.message : "Failed to save settings"));
		} finally {
			setSettingsSaving(false);
		}
	};

	const activeSourceCount = (Object.values(settings) as boolean[]).filter(Boolean).length;

	return (
		<div style={{ maxWidth: 1100, margin: "0 auto" }}>
			{/* Page header */}
			<div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
				<div>
					<h1 className="page-title">Search Jobs</h1>
					<p className="page-subtitle">Find job listings from Google Jobs, FindWork, and Jooble.</p>
				</div>
				<button className="btn btn-secondary btn-sm" onClick={openSettings} style={{ flexShrink: 0 }}>
					<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
						<path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.465l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
					</svg>
					&nbsp; Search Settings
					{activeSourceCount < 3 && <span style={{ background: "var(--primary)", color: "#fff", borderRadius: "var(--r-full)", fontSize: "0.7rem", padding: "1px 6px", marginLeft: 2 }}>{activeSourceCount}</span>}
				</button>
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
			{googleError && <div className="alert alert-warning">⚠️ {googleError}</div>}
			{joobleError && <div className="alert alert-warning">⚠️ {joobleError}</div>}

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
									{displayedResults.map((job, idx) => {
										const key = jobKey(job);
										const saved = savedKeys.has(key);
										return (
											<tr key={idx}>
												<td className="td-title">{job.title}</td>
												<td>{job.company || "—"}</td>
												<td className="td-muted">{job.location || "—"}</td>
												<td>
													{job.description ? (
														<span className="td-desc" title="Click to read full description" onClick={() => setModalJob(job)} dangerouslySetInnerHTML={{ __html: truncate(job.description) }} />
													) : (
														<span className="td-muted" style={{ fontStyle: "italic" }}>
															No description —{" "}
															{job.job_url && (
																<a href={job.job_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "inherit" }}>
																	view job
																</a>
															)}
														</span>
													)}
												</td>
												<td>
													<span className={sourceBadgeClass(job.source)}>{job.source}</span>
												</td>
												<td>
													{saved ? (
														<span className="btn btn-applied btn-sm" style={{ cursor: "default", pointerEvents: "none" }}>
															✓ Applied
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
						<div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
							{/* Row 1: info + per-page selector */}
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
								<span style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
									Showing{" "}
									<strong>
										{(clientPage - 1) * pageSize + 1}–{Math.min(clientPage * pageSize, results.length)}
									</strong>{" "}
									of <strong>{results.length}</strong> results{hasMore ? " (this batch)" : ""}
								</span>
								<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
									<span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Rows per page:</span>
									<select
										className="form-select form-select-compact"
										value={pageSize}
										onChange={(e) => {
											setPageSize(Number(e.target.value));
											setClientPage(1);
										}}
										aria-label="Rows per page">
										{PAGE_SIZES.map((s) => (
											<option key={s} value={s}>
												{s}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Row 2: client-page nav + optional API batch nav */}
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
								{/* Client-page numbers */}
								<div className="pagination-controls" style={{ margin: 0 }}>
									<button className="pg-btn" onClick={() => setClientPage((p) => p - 1)} disabled={clientPage === 1}>
										‹
									</button>
									{Array.from({ length: totalClientPages }, (_, i) => i + 1).map((p) => (
										<button key={p} className={`pg-btn${p === clientPage ? " pg-active" : ""}`} onClick={() => setClientPage(p)}>
											{p}
										</button>
									))}
									<button className="pg-btn" onClick={() => setClientPage((p) => p + 1)} disabled={clientPage === totalClientPages}>
										›
									</button>
								</div>

								{/* API batch navigation */}
								{(currentPage > 1 || hasMore) && (
									<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
										<span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginRight: 2 }}>Load more results:</span>
										<button className="pg-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>
											← Prev batch
										</button>
										<button className="pg-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={!hasMore || loading}>
											Next batch →
										</button>
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</div>

			{/* Search Settings Modal */}
			{showSettings && (
				<div className="modal-backdrop" onClick={() => setShowSettings(false)}>
					<div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<div className="min-w-0">
								<div className="modal-title">Search Settings</div>
								<div className="modal-company">Choose which job sources to query</div>
							</div>
							<button className="modal-close" onClick={() => setShowSettings(false)} aria-label="Close">
								&times;
							</button>
						</div>
						<div className="modal-body">
							<p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>Select one or more job sources. Changes are saved to your account and persist across sessions.</p>
							<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
								{(Object.keys(DEFAULT_SETTINGS) as (keyof SearchSettings)[]).map((key) => (
									<label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "12px 14px", borderRadius: "var(--r-md)", border: "1.5px solid", borderColor: draftSettings[key] ? "var(--primary)" : "var(--border)", background: draftSettings[key] ? "var(--primary-light)" : "var(--card)", transition: "border-color 0.15s, background 0.15s" }}>
										<input type="checkbox" checked={draftSettings[key]} onChange={(e) => setDraftSettings((prev) => ({ ...prev, [key]: e.target.checked }))} style={{ marginTop: 2, width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer", flexShrink: 0 }} />
										<div>
											<div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>{SOURCE_LABELS[key]}</div>
											<div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
												{key === "google" && "Google Jobs results via SerpAPI"}
												{key === "findwork" && "Tech job listings from FindWork.dev"}
												{key === "jooble" && "Job listings from Jooble.org"}
											</div>
										</div>
									</label>
								))}
							</div>
							{(Object.values(draftSettings) as boolean[]).every((v) => !v) && <p style={{ marginTop: 14, fontSize: "0.83rem", color: "var(--danger)", background: "var(--danger-light)", padding: "8px 12px", borderRadius: "var(--r-md)" }}>At least one source must be selected.</p>}
							{settingsError && <p style={{ marginTop: 14, fontSize: "0.83rem", color: "var(--danger)", background: "var(--danger-light)", padding: "8px 12px", borderRadius: "var(--r-md)" }}>⚠️ {settingsError}</p>}
						</div>
						<div className="modal-footer">
							<button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(false)}>
								Cancel
							</button>
							<button className="btn btn-primary btn-sm" disabled={settingsSaving || (Object.values(draftSettings) as boolean[]).every((v) => !v)} onClick={saveSettings}>
								{settingsSaving ? (
									<>
										<span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff", width: 12, height: 12 }} /> Saving…
									</>
								) : (
									"Save Settings"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} onOpenJob={() => handleOpenJob(modalJob)} />}
		</div>
	);
}
