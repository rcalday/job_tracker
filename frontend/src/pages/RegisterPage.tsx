import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:3000/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, username, email, password }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Registration failed");
			}

			navigate("/login");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Registration failed");
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
						<span className="auth-logo-icon">💼</span>
						<span className="auth-logo-name" style={{ color: "#fff" }}>Job Tracker</span>
					</div>
					<div className="auth-panel-headline">Start your<br />job search<br />journey.</div>
					<div className="auth-panel-sub">
						Join thousands of job seekers who use Job Tracker to land their dream role.
					</div>
					<div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 4 }}>
						{[
							{ icon: "✅", text: "Free to use, no credit card required" },
							{ icon: "🔒", text: "Your data stays private and secure" },
							{ icon: "âš¡", text: "Set up in under a minute" },
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
						<span className="auth-logo-icon">💼</span>
						<span className="auth-logo-name">Job Tracker</span>
					</div>

					<h1 className="auth-heading">Create account</h1>
					<p className="auth-subheading">Sign up to start tracking your job applications.</p>

					<form onSubmit={handleSubmit} autoComplete="on">
						<div className="form-group">
							<label htmlFor="register-name" className="form-label">Full Name</label>
							<input
								id="register-name"
								type="text"
								className="form-input"
								placeholder="Your full name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoFocus
							/>
						</div>

						<div className="form-group">
							<label htmlFor="register-username" className="form-label">Username</label>
							<input
								id="register-username"
								type="text"
								className="form-input"
								placeholder="Choose a username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="register-email" className="form-label">
								Email <span className="optional">(optional)</span>
							</label>
							<input
								id="register-email"
								type="email"
								className="form-input"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="register-password" className="form-label">Password</label>
							<input
								id="register-password"
								type="password"
								className="form-input"
								placeholder="Create a password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						{error && <div className="alert alert-error">{error}</div>}

						<button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
							{loading ? (
								<><span className="spinner" style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} /> Creating account...</>
							) : (
								"Create Account"
							)}
						</button>
					</form>

					<div className="auth-footer">
						Already have an account?{" "}
						<Link to="/login">Sign in</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
