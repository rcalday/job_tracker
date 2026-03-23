import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
		} catch (err: any) {
			setError(err.message || "Login failed");
			setIsAuthenticated(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-page card-centered">
			<div className="card">
				<div className="brand-header">
					<span className="brand-logo">🔎</span>
					<span className="brand-title">Job Tracker</span>
				</div>
				<h2>Sign In</h2>
				<form onSubmit={handleSubmit}>
					<input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
					<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					<button type="submit" disabled={loading}>
						{loading ? "Logging in..." : "Login"}
					</button>
					{error && <div className="error">{error}</div>}
				</form>
				<div className="form-footer">
					Don't have an account? <a href="/register">Register</a>
				</div>
			</div>
		</div>
	);
}
