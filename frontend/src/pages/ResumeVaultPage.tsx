import { useEffect, useRef, useState } from "react";

interface Resume {
	id: number;
	file_name: string;
	file_path: string;
	created_at: string;
}

function getFileIcon(fileName: string) {
	const ext = fileName.split(".").pop()?.toLowerCase();
	if (ext === "pdf") return "📄";
	if (ext === "docx" || ext === "doc") return "📝";
	return "📎";
}

export default function ResumeVaultPage() {
	const [resumes, setResumes] = useState<Resume[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedFile(e.target.files?.[0] ?? null);
		setUploadError("");
	};

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
			setSelectedFile(null);
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

	return (
		<div style={{ maxWidth: 740, margin: "0 auto" }}>
			{/* Page header */}
			<div className="page-header">
				<h1 className="page-title">Resume Vault</h1>
				<p className="page-subtitle">Upload and manage your resumes. PDF or DOCX, max 10 MB.</p>
			</div>

			{/* Upload card */}
			<div className="card" style={{ marginBottom: 20 }}>
				<div className="card-header">
					<span className="card-title">Upload Resume</span>
				</div>
				<div className="card-body">
					<form onSubmit={handleUpload}>
						<label htmlFor="resume-file-input" className={`upload-trigger${selectedFile ? " has-file" : ""}`} style={{ marginBottom: 14 }}>
							<span className="upload-icon">{selectedFile ? "✅" : "📤"}</span>
							<span className="upload-label">{selectedFile ? selectedFile.name : "Click to choose a file"}</span>
							<span className="upload-hint">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF, DOC, DOCX — up to 10 MB"}</span>
							<input id="resume-file-input" ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
						</label>

						{uploadError && <div className="alert alert-error">{uploadError}</div>}

						<button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile} style={{ width: "100%" }}>
							{uploading ? (
								<>
									<span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} /> Uploading...
								</>
							) : (
								<>
									<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
										<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
										<path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
									</svg>
									Upload Resume
								</>
							)}
						</button>
					</form>
				</div>
			</div>

			{/* List card */}
			<div className="card">
				<div className="card-header">
					<span className="card-title">Saved Resumes</span>
					<span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{!loading && `${resumes.length} file${resumes.length !== 1 ? "s" : ""}`}</span>
				</div>
				<div className="card-body">
					{error && (
						<div className="alert alert-error" style={{ marginBottom: 12 }}>
							{error}
						</div>
					)}

					{loading ? (
						<div className="loading-center" style={{ padding: 32 }}>
							<span className="spinner" />
							Loading...
						</div>
					) : resumes.length === 0 ? (
						<div className="empty-state" style={{ padding: "32px 12px" }}>
							<span style={{ fontSize: "2.5rem", opacity: 0.4 }}>📂</span>
							<p className="empty-title" style={{ marginTop: 10 }}>
								No resumes uploaded yet.
							</p>
							<p className="empty-desc">Use the upload form above to add your first resume.</p>
						</div>
					) : (
						<div>
							{resumes.map((resume) => (
								<div key={resume.id} className="resume-item">
									<span className="resume-icon">{getFileIcon(resume.file_name)}</span>
									<div className="resume-meta">
										<div className="resume-name">{resume.file_name}</div>
										<div className="resume-date">Uploaded {new Date(resume.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
									</div>
									<div className="resume-actions">
										<a href={`http://localhost:3000${resume.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
											View ↗
										</a>
										<button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "transparent", border: "1.5px solid var(--danger)" }} onClick={() => handleDelete(resume.id)} disabled={deletingId === resume.id}>
											{deletingId === resume.id ? <span className="spinner" style={{ width: 12, height: 12, borderColor: "var(--danger)", borderTopColor: "transparent" }} /> : "Delete"}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
