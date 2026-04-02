import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import type { AxiosError } from "axios";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { setUser } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			await API.post("/auth/login", { username, password, remember_me: rememberMe });

			const meRes = await API.get("/auth/me");
			setUser(meRes.data.user);
			navigate("/dashboard");
		} catch (err: unknown) {
			const axiosErr = err as AxiosError<{ error?: string }>;
			setError(axiosErr.response?.data?.error ?? (err instanceof Error ? err.message : "Something went wrong"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			{/* Left decorative panel */}
			<div className="auth-panel-left">
				<div style={{ maxWidth: 380 }}>
					<div className="auth-logo" style={{ marginBottom: 40 }}>
						<img src="/job_tracker.png" alt="Job Tracker" style={{ width: "75%", height: "100%", objectFit: "contain" }} />
					</div>
					<div className="auth-panel-headline">
						Track every
						<br />
						opportunity.
					</div>
					<div className="auth-panel-sub">Stay organized and never lose track of a job application again.</div>
					<div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 4 }}>
						{[
							{ icon: "🔍", text: "Search jobs from multiple sources" },
							{ icon: "📋", text: "Track application status in one place" },
							{ icon: "📊", text: "Visualize your job search progress" },
						].map((f) => (
							<div className="auth-feature" key={f.text}>
								<span className="auth-feature-icon">{f.icon}</span>
								{f.text}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Right form panel */}
			<div className="auth-panel-right">
				<div className="auth-form-wrap">
					<div className="auth-logo d-block d-md-none">
						<img src="/job_tracker.png" alt="Job Tracker" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
					</div>

					<h1 className="auth-heading">Welcome back</h1>
					<p className="auth-subheading">Sign in to continue to your dashboard.</p>

					<form onSubmit={handleSubmit} autoComplete="on">
						<div className="form-group">
							<label htmlFor="login-username" className="form-label">
								Username
							</label>
							<input id="login-username" type="text" className="form-input" placeholder="your-username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
						</div>

						<div className="form-group">
							<label htmlFor="login-password" className="form-label">
								Password
							</label>
							<input id="login-password" type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
						</div>

						<div className="form-group check-row" style={{ marginBottom: 20 }}>
							<input type="checkbox" id="keep-signed-in" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
							<label htmlFor="keep-signed-in">Keep me signed in</label>
						</div>

						{error && <div className="alert alert-error">{error}</div>}

						<button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
							{loading ? (
								<>
									<span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} /> Signing in...
								</>
							) : (
								"Sign In"
							)}
						</button>
					</form>

					<div className="auth-footer">
						New here? <Link to="/register">Create an account</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
