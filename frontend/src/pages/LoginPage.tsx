import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

interface Props {
	setIsAuthenticated: (auth: boolean) => void;
}

export default function LoginPage({ setIsAuthenticated }: Props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:3000/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ username, password }),
			});

			if (!res.ok) throw new Error("Invalid credentials");

			setIsAuthenticated(true);
			navigate("/dashboard");
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Something went wrong");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="shadow-lg rounded-4 bg-white p-4 p-md-5 w-100"
			style={{
				maxWidth: 420,
				width: "100%",
				boxSizing: "border-box",
			}}>
			<div className="mb-2 text-uppercase fw-semibold text-success small" style={{ letterSpacing: 1.2 }}>
				Secure Access
			</div>

			<h1
				className="mb-2 fw-bold"
				style={{
					fontFamily: "serif",
					fontSize: "2.2rem",
					color: "#36394b",
					lineHeight: 1.1,
				}}>
				Welcome back
			</h1>

			<div className="mb-4 text-secondary" style={{ fontSize: "1.05rem" }}>
				Sign in to continue to your dashboard.
			</div>

			<form onSubmit={handleSubmit} autoComplete="on">
				<div className="mb-3">
					<label htmlFor="login-username" className="form-label fw-semibold">
						Username
					</label>
					<input id="login-username" type="text" className="form-control form-control-lg" placeholder="your-username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
				</div>

				<div className="mb-3">
					<label htmlFor="login-password" className="form-label fw-semibold">
						Password
					</label>
					<input id="login-password" type="password" className="form-control form-control-lg" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				</div>

				<div className="mb-3 form-check">
					<input type="checkbox" className="form-check-input" id="keep-signed-in" />
					<label className="form-check-label text-secondary" htmlFor="keep-signed-in" style={{ fontSize: "0.97rem" }}>
						Keep me signed in
					</label>
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
					{loading ? "Signing in..." : "Sign In"}
				</button>
			</form>

			<div className="mt-4 text-secondary text-center" style={{ fontSize: "1rem" }}>
				New here?{" "}
				<Link to="/register" className="fw-semibold text-success text-decoration-none">
					Create an account
				</Link>
			</div>
		</div>
	);
}
