import { useEffect, useRef, useState } from "react";
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

const STATUSES = ["Saved", "Applied", "Interview", "Rejected"] as const;
const PAGE_SIZE = 10;

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

function truncate(text: string, max = 85) {
	if (!text) return "";
	return text.length > max ? text.slice(0, max) + "…" : text;
}

function buildPageNumbers(page: number, totalPages: number): (number | "…")[] {
	const pages: (number | "…")[] = [];
	const range = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);
	range.forEach((p, idx) => {
		if (idx > 0 && p - (range[idx - 1] as number) > 1) pages.push("…");
		pages.push(p);
	});
	return pages;
}

export default function MyApplicationsPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalJob, setModalJob] = useState<ModalJob | null>(null);
	const [updatingId, setUpdatingId] = useState<number | null>(null);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	function handleSearchChange(val: string) {
		setSearchInput(val);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setSearch(val);
			setPage(1);
		}, 400);
	}

	function handleStatusFilter(val: string) {
		setStatusFilter(val);
		setPage(1);
	}

	function clearFilters() {
		setSearchInput("");
		setSearch("");
		setStatusFilter("");
		setPage(1);
	}

	useEffect(() => {
		let cancelled = false;
		async function fetchApplications() {
			setLoading(true);
			setError("");
			try {
				const params = new URLSearchParams();
				if (search) params.set("search", search);
				if (statusFilter) params.set("status", statusFilter);
				params.set("page", String(page));
				params.set("limit", String(PAGE_SIZE));

				const res = await fetch(`http://localhost:3000/auth/applications?${params}`, { credentials: "include" });
				if (!res.ok) throw new Error("Failed to load applications");
				const data = await res.json();
				if (cancelled) return;
				setApplications(data.applications ?? []);
				setTotal(data.total ?? 0);
				setTotalPages(data.totalPages ?? 1);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchApplications();
		return () => {
			cancelled = true;
		};
	}, [search, statusFilter, page]);

	async function handleStatusChange(id: number, newStatus: string) {
		setUpdatingId(id);
		try {
			const res = await fetch(`http://localhost:3000/auth/applications/${id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error("Failed to update status");
			setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
		} catch {
			// keep UI consistent
		} finally {
			setUpdatingId(null);
		}
	}

	const isFiltered = search || statusFilter;

	return (
		<div style={{ maxWidth: 1100, margin: "0 auto" }}>
			{/* Page header */}
			<div className="page-header">
				<h1 className="page-title">My Applications</h1>
				<p className="page-subtitle">Track and manage every job you've applied to.</p>
			</div>

			{/* Filter bar */}
			<div className="card" style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 20px", alignItems: "center" }}>
					{/* Search */}
					<div className="search-wrap" style={{ flex: "1 1 260px" }}>
						<svg className="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
							<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
						</svg>
						<input type="text" className="form-input" placeholder="Search title, company, location…" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} />
						{searchInput && (
							<button className="search-clear" onClick={() => handleSearchChange("")} aria-label="Clear search">
								<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
									<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
								</svg>
							</button>
						)}
					</div>

					{/* Status filter */}
					<select className="form-select" style={{ width: "auto", flexShrink: 0 }} value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)} aria-label="Filter by status">
						<option value="">All statuses</option>
						{STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>

					{isFiltered && (
						<button className="btn btn-secondary btn-sm" onClick={clearFilters}>
							Clear filters
						</button>
					)}

					<span className="ms-auto" style={{ fontSize: "0.83rem", color: "var(--text-muted)", flexShrink: 0 }}>
						{loading ? "…" : `${total} result${total !== 1 ? "s" : ""}`}
					</span>
				</div>
			</div>

			{/* Table card */}
			<div className="card">
				{loading ? (
					<div className="loading-center">
						<span className="spinner" />
						Loading applications…
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
						<p className="empty-title">{isFiltered ? "No applications match your filters." : "No applications yet."}</p>
						{!isFiltered && (
							<p className="empty-desc">
								Head to <strong>Search Jobs</strong> to save your first application.
							</p>
						)}
					</div>
				) : (
					<>
						<div className="table-wrap">
							<table className="data-table">
								<thead>
									<tr>
										<th>Job Title</th>
										<th>Company</th>
										<th>Location</th>
										<th>Description</th>
										<th style={{ minWidth: 180 }}>Status</th>
										<th style={{ whiteSpace: "nowrap" }}>Date</th>
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
														{truncate(app.description)}
													</span>
												) : (
													<span className="td-muted">—</span>
												)}
											</td>
											<td>
												<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
													<span className={statusClass(app.status)}>{app.status}</span>
													<select className="form-select" style={{ fontSize: "0.82rem", padding: "4px 8px", width: "auto" }} value={app.status} disabled={updatingId === app.id} onChange={(e) => handleStatusChange(app.id, e.target.value)} aria-label="Update status">
														{STATUSES.map((s) => (
															<option key={s} value={s}>
																{s}
															</option>
														))}
													</select>
												</div>
											</td>
											<td className="td-muted" style={{ whiteSpace: "nowrap" }}>
												{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "—"}
											</td>
											<td>
												{app.job_link && (
													<a href={app.job_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
														Open ↗
													</a>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="pagination-bar">
								<span className="pagination-info">
									Page {page} of {totalPages} · {total} total
								</span>
								<div className="pagination-controls">
									<button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1} title="First page">
										«
									</button>
									<button className="pg-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
										‹
									</button>
									{buildPageNumbers(page, totalPages).map((item, idx) =>
										item === "…" ? (
											<button key={`ell-${idx}`} className="pg-btn" disabled>
												…
											</button>
										) : (
											<button key={item} className={`pg-btn${item === page ? " pg-active" : ""}`} onClick={() => setPage(item as number)}>
												{item}
											</button>
										),
									)}
									<button className="pg-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
										›
									</button>
									<button className="pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last page">
										»
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
		</div>
	);
}
