import { useEffect, useRef, useState } from "react";

interface Resume {
	id: number;
	file_name: string;
	file_path: string;
	created_at: string;
}

export default function ResumeVaultPage() {
	const [resumes, setResumes] = useState<Resume[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const fetchResumes = async () => {
		try {
			setLoading(true);
			const res = await fetch("http://localhost:3000/auth/resume", { credentials: "include" });
			if (!res.ok) throw new Error("Failed to load resumes");
			const data = await res.json();
			setResumes(data.resumes ?? []);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to load resumes");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchResumes();
	}, []);

	const handleUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		const file = fileRef.current?.files?.[0];
		if (!file) return;

		setUploading(true);
		setUploadError("");

		const formData = new FormData();
		formData.append("resume", file);

		try {
			const res = await fetch("http://localhost:3000/auth/resume/upload", {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error((d as { error?: string }).error || "Upload failed");
			}

			if (fileRef.current) fileRef.current.value = "";
			await fetchResumes();
		} catch (err: unknown) {
			setUploadError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Delete this resume?")) return;
		setDeletingId(id);
		try {
			const res = await fetch(`http://localhost:3000/auth/resume/${id}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) throw new Error("Delete failed");
			setResumes((prev) => prev.filter((r) => r.id !== id));
		} catch {
			setError("Failed to delete resume");
		} finally {
			setDeletingId(null);
		}
	};

	const getFileIcon = (fileName: string) => {
		const ext = fileName.split(".").pop()?.toLowerCase();
		if (ext === "pdf") return "📄";
		if (ext === "docx" || ext === "doc") return "📝";
		return "📎";
	};

	return (
		<div style={{ maxWidth: 800, margin: "0 auto" }}>
			<h1 className="fw-bold mb-1" style={{ fontSize: "1.7rem", color: "#36394b" }}>
				Resume Vault
			</h1>
			<p className="text-muted mb-4">Upload and manage your resumes (PDF or DOCX, max 10 MB).</p>

			{/* Upload form */}
			<div className="bg-white rounded-4 shadow-sm border p-4 mb-4">
				<h2 className="fw-semibold mb-3" style={{ fontSize: "1.05rem", color: "#36394b" }}>
					Upload Resume
				</h2>
				<form onSubmit={handleUpload} className="d-flex gap-2 align-items-start flex-wrap">
					<div className="flex-grow-1">
						<input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="form-control" required />
					</div>
					<button
						type="submit"
						className="btn fw-semibold"
						style={{
							background: "linear-gradient(90deg, #21867a 60%, #1b6e6b 100%)",
							border: "none",
							color: "#fff",
							borderRadius: "0.5rem",
							whiteSpace: "nowrap",
						}}
						disabled={uploading}>
						{uploading ? (
							<>
								<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
								Uploading...
							</>
						) : (
							"Upload"
						)}
					</button>
				</form>
				{uploadError && <div className="alert alert-danger py-2 mt-2 mb-0">{uploadError}</div>}
			</div>

			{/* Resume list */}
			<div className="bg-white rounded-4 shadow-sm border p-4">
				<h2 className="fw-semibold mb-3" style={{ fontSize: "1.05rem", color: "#36394b" }}>
					Saved Resumes
				</h2>

				{error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

				{loading ? (
					<div className="text-center text-muted py-4">Loading...</div>
				) : resumes.length === 0 ? (
					<div className="text-center text-muted py-4">No resumes uploaded yet.</div>
				) : (
					<ul className="list-group list-group-flush">
						{resumes.map((resume) => (
							<li key={resume.id} className="list-group-item d-flex align-items-center gap-3 px-0 py-3">
								<span style={{ fontSize: "1.6rem" }}>{getFileIcon(resume.file_name)}</span>
								<div className="flex-grow-1 min-w-0">
									<div className="fw-medium text-truncate">{resume.file_name}</div>
									<div className="text-muted" style={{ fontSize: "0.8rem" }}>
										Uploaded {new Date(resume.created_at).toLocaleDateString()}
									</div>
								</div>
								<div className="d-flex gap-2 flex-shrink-0">
									<a href={`http://localhost:3000${resume.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">
										View
									</a>
									<button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(resume.id)} disabled={deletingId === resume.id}>
										{deletingId === resume.id ? "..." : "Delete"}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
