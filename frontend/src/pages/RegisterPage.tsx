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
		<div
			style={{
				minHeight: "100vh",
				background: "radial-gradient(circle at 15% 25%, #ffe7d1 20%, transparent 60%), radial-gradient(circle at 90% 80%, #cbe7e3 30%, transparent 70%), #f7f8fa",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "2rem 1rem",
			}}>
			<div className="shadow-lg rounded-4 bg-white p-4 p-md-5 w-100" style={{ maxWidth: 420 }}>
				<div className="mb-2 text-uppercase fw-semibold text-success small" style={{ letterSpacing: 1.2 }}>
					Create Account
				</div>

				<h1 className="mb-2 fw-bold" style={{ fontFamily: "serif", fontSize: "2.2rem", color: "#36394b", lineHeight: 1.1 }}>
					Register
				</h1>

				<div className="mb-4 text-secondary" style={{ fontSize: "1.05rem" }}>
					Sign up to start tracking your job applications.
				</div>

				<form onSubmit={handleSubmit} autoComplete="on">
					<div className="mb-3">
						<label htmlFor="register-name" className="form-label fw-semibold">
							Full Name
						</label>
						<input id="register-name" type="text" className="form-control form-control-lg" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
					</div>

					<div className="mb-3">
						<label htmlFor="register-username" className="form-label fw-semibold">
							Username
						</label>
						<input id="register-username" type="text" className="form-control form-control-lg" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
					</div>

					<div className="mb-3">
						<label htmlFor="register-email" className="form-label fw-semibold">
							Email <span className="fw-normal text-muted">(optional)</span>
						</label>
						<input id="register-email" type="email" className="form-control form-control-lg" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
					</div>

					<div className="mb-3">
						<label htmlFor="register-password" className="form-label fw-semibold">
							Password
						</label>
						<input id="register-password" type="password" className="form-control form-control-lg" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</div>

					{error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

					<button
						type="submit"
						className="btn btn-lg w-100 fw-semibold shadow-sm"
						style={{
							fontSize: "1.1rem",
							borderRadius: "2rem",
							background: "linear-gradient(90deg, #21867a 60%, #1b6e6b 100%)",
							border: "none",
							color: "#fff",
						}}
						disabled={loading}>
						{loading ? "Registering..." : "Create Account"}
					</button>
				</form>

				<div className="mt-4 text-secondary text-center" style={{ fontSize: "1rem" }}>
					Already have an account?{" "}
					<Link to="/login" className="fw-semibold text-success text-decoration-none">
						Sign in
					</Link>
				</div>
			</div>
		</div>
	);
}
