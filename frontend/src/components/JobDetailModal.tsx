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
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose]);

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="modal-header">
					<div className="min-w-0">
						<div className="modal-title text-truncate">{job.title}</div>
						{job.company && <div className="modal-company">{job.company}</div>}
					</div>
					<button className="modal-close" onClick={onClose} aria-label="Close">
						&times;
					</button>
				</div>

				{/* Body */}
				<div className="modal-body">
					{job.description ? (
						<p style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, margin: 0 }}>
							{job.description}
						</p>
					) : (
						<p style={{ color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
							No description available.
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="modal-footer">
					<button className="btn btn-secondary btn-sm" onClick={onClose}>
						Close
					</button>
					{(job.job_url || onOpenJob) && (
						<button
							className="btn btn-primary btn-sm"
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

