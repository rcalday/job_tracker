import { useEffect } from "react";

export interface ModalJob {
	title: string;
	company?: string;
	description?: string;
	job_url?: string;
}

interface Props {
	job: ModalJob;
	onClose: () => void;
	onOpenJob?: () => void;
}

export default function JobDetailModal({ job, onClose, onOpenJob }: Props) {
	// Close on Escape key
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose]);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.45)",
				zIndex: 1050,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "1rem",
			}}
			onClick={onClose}>
			<div
				style={{
					background: "#fff",
					borderRadius: 12,
					width: "100%",
					maxWidth: 620,
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
				}}
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="d-flex align-items-start justify-content-between gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
					<div className="min-w-0">
						<h5 className="fw-bold mb-0 text-truncate" style={{ color: "#36394b", fontSize: "1.1rem" }}>
							{job.title}
						</h5>
						{job.company && (
							<div className="text-muted mt-1" style={{ fontSize: "0.88rem" }}>
								{job.company}
							</div>
						)}
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: "2px 4px",
							color: "#888",
							flexShrink: 0,
							fontSize: "1.3rem",
							lineHeight: 1,
						}}
						aria-label="Close">
						&times;
					</button>
				</div>

				{/* Body */}
				<div className="px-4 py-3 overflow-auto flex-grow-1">{job.description ? <p style={{ whiteSpace: "pre-wrap", fontSize: "0.93rem", color: "#444", lineHeight: 1.7 }}>{job.description}</p> : <p className="text-muted fst-italic">No description available.</p>}</div>

				{/* Footer */}
				<div className="px-4 py-3 d-flex justify-content-end gap-2" style={{ borderTop: "1px solid #f0f0f0" }}>
					<button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
						Close
					</button>
					{(job.job_url || onOpenJob) && (
						<button
							className="btn btn-sm fw-semibold"
							style={{
								background: "linear-gradient(90deg, #21867a 60%, #1b6e6b 100%)",
								border: "none",
								color: "#fff",
							}}
							onClick={() => {
								if (onOpenJob) {
									onOpenJob();
								} else if (job.job_url) {
									window.open(job.job_url, "_blank", "noopener,noreferrer");
								}
							}}>
							Open Job ↗
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
