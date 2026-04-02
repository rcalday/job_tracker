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

const STATUS_COLORS: Record<string, string> = {
	Applied: "primary",
	Interview: "success",
	Rejected: "danger",
	Saved: "secondary",
};

function truncate(text: string, max = 90) {
	if (!text) return "";
	return text.length > max ? text.slice(0, max) + "â€¦" : text;
}

export default function MyApplicationsPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalJob, setModalJob] = useState<ModalJob | null>(null);
	const [updatingId, setUpdatingId] = useState<number | null>(null);

	// Search / filter / pagination
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

				const res = await fetch(`http://localhost:3000/auth/applications?${params}`, {
					credentials: "include",
				});
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

	// Build page numbers with ellipsis
	function buildPageNumbers(): (number | "â€¦")[] {
		const pages: (number | "â€¦")[] = [];
		const range = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);
		range.forEach((p, idx) => {
			if (idx > 0 && p - (range[idx - 1] as number) > 1) pages.push("â€¦");
			pages.push(p);
		});
		return pages;
	}

	return (
		<div className="p-4">
			<h1 className="fs-4 fw-bold mb-1">My Applications</h1>
			<p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
				Track and manage every job you've applied to. Update statuses as your application progresses.
			</p>

			{/* Search & Filter Bar */}
			<div className="bg-white rounded-4 shadow-sm px-4 py-3 border mb-3 d-flex flex-wrap gap-2 align-items-center">
				{/* Search input */}
				<div className="input-group" style={{ maxWidth: 320 }}>
					<span className="input-group-text bg-transparent border-end-0">
						<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-muted">
							<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
						</svg>
					</span>
					<input type="text" className="form-control border-start-0" placeholder="Search title, company, locationâ€¦" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} />
					{searchInput && (
						<button className="btn btn-outline-secondary" type="button" onClick={() => handleSearchChange("")} aria-label="Clear search">
							âœ•
						</button>
					)}
				</div>

				{/* Status filter */}
				<select className="form-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)} aria-label="Filter by status">
					<option value="">All statuses</option>
					{STATUSES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>

				{isFiltered && (
					<button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
						Clear filters
					</button>
				)}

				<span className="ms-auto text-muted" style={{ fontSize: "0.85rem" }}>
					{loading ? "â€¦" : `${total} result${total !== 1 ? "s" : ""}`}
				</span>
			</div>

			{/* Table Card */}
			<div className="bg-white rounded-4 shadow-sm p-4 border">
				{loading ? (
					<div className="text-center text-secondary py-5">
						<div className="spinner-border spinner-border-sm me-2" role="status" />
						Loading applicationsâ€¦
					</div>
				) : error ? (
					<div className="alert alert-danger">{error}</div>
				) : applications.length === 0 ? (
					<div className="text-center text-muted py-5">
						<svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" className="mb-3 opacity-25">
							<path d="M6 1a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V2a1 1 0 0 0-1-1H6zM5 3V2h6v1H5zm-1 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
						</svg>
						<div className="mb-1">{isFiltered ? "No applications match your filters." : "No applications yet."}</div>
						{!isFiltered && (
							<small>
								Head to <strong>Search Jobs</strong> to save your first application.
							</small>
						)}
					</div>
				) : (
					<>
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
										<th>Date</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{applications.map((app) => (
										<tr key={app.id}>
											<td className="fw-medium">{app.job_title}</td>
											<td>{app.company || "â€”"}</td>
											<td>{app.location || "â€”"}</td>
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
														{truncate(app.description)}
													</span>
												) : (
													<span className="text-muted" style={{ fontSize: "0.83rem" }}>
														â€”
													</span>
												)}
											</td>
											<td style={{ minWidth: 140 }}>
												<div className="d-flex align-items-center gap-2">
													<span className={`badge bg-${STATUS_COLORS[app.status] ?? "secondary"}`} style={{ fontSize: "0.72rem", minWidth: 62 }}>
														{app.status}
													</span>
													<select className="form-select form-select-sm" style={{ fontSize: "0.8rem", width: "auto" }} value={app.status} disabled={updatingId === app.id} onChange={(e) => handleStatusChange(app.id, e.target.value)} aria-label="Update status">
														{STATUSES.map((s) => (
															<option key={s} value={s}>
																{s}
															</option>
														))}
													</select>
												</div>
											</td>
											<td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "â€”"}</td>
											<td>
												{app.job_link && (
													<a href={app.job_link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">
														Open â†—
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
							<div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
								<small className="text-muted">
									Page {page} of {totalPages} &middot; {total} total
								</small>
								<nav aria-label="Applications pagination">
									<ul className="pagination pagination-sm mb-0">
										<li className={`page-item ${page === 1 ? "disabled" : ""}`}>
											<button className="page-link" onClick={() => setPage(1)} disabled={page === 1}>
												Â«
											</button>
										</li>
										<li className={`page-item ${page === 1 ? "disabled" : ""}`}>
											<button className="page-link" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
												â€¹
											</button>
										</li>
										{buildPageNumbers().map((item, idx) =>
											item === "â€¦" ? (
												<li key={`ell-${idx}`} className="page-item disabled">
													<span className="page-link">â€¦</span>
												</li>
											) : (
												<li key={item} className={`page-item ${item === page ? "active" : ""}`}>
													<button className="page-link" onClick={() => setPage(item as number)}>
														{item}
													</button>
												</li>
											),
										)}
										<li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
											<button className="page-link" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
												â€º
											</button>
										</li>
										<li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
											<button className="page-link" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
												Â»
											</button>
										</li>
									</ul>
								</nav>
							</div>
						)}
					</>
				)}
			</div>

			{modalJob && <JobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
		</div>
	);
}
