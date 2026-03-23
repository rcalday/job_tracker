import { useState } from "react";

export default function RegisterPage() {
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			const res = await fetch("http://localhost:3000/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, username, password }),
			});
			if (!res.ok) throw new Error("Registration failed");
			setSuccess("Registration successful! You can now log in.");
		} catch (err: any) {
			setError(err.message || "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="register-page card-centered">
			<div className="card">
				<div className="brand-header">
					<span className="brand-logo">🔎</span>
					<span className="brand-title">Job Tracker</span>
				</div>
				<h2>Create Account</h2>
				<form onSubmit={handleSubmit}>
					<input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
					<input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
					<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					<button type="submit" disabled={loading}>
						{loading ? "Registering..." : "Register"}
					</button>
					{error && <div className="error">{error}</div>}
					{success && <div className="success">{success}</div>}
				</form>
				<div className="form-footer">
					Already have an account? <a href="/login">Login</a>
				</div>
			</div>
		</div>
	);
}
