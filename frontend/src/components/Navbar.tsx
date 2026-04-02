import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
	const { user, logout } = useAuth();
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const initials = user?.login_name
		? user.login_name
				.split(" ")
				.map((w) => w[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<nav className="navbar bg-white border-bottom px-3 px-md-4" style={{ height: 60, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
			<div className="d-flex align-items-center gap-2">
				<span style={{ fontSize: "1.4rem" }}>💼</span>
				<span className="fw-bold text-primary" style={{ fontSize: "1.1rem" }}>
					Job Tracker
				</span>
			</div>

			<div className="ms-auto position-relative" ref={dropdownRef}>
				<button className="btn d-flex align-items-center gap-2 py-1 px-2 rounded-pill border" style={{ background: "transparent", borderColor: "#dee2e6" }} onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
					<div
						style={{
							width: 34,
							height: 34,
							borderRadius: "50%",
							background: "linear-gradient(135deg, #21867a, #1b6e6b)",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontWeight: 700,
							fontSize: "0.85rem",
							flexShrink: 0,
						}}>
						{initials}
					</div>
					<div className="text-start d-none d-md-block">
						<div className="fw-semibold lh-sm" style={{ fontSize: "0.88rem", color: "#36394b" }}>
							{user?.login_name}
						</div>
						<div className="text-muted lh-sm" style={{ fontSize: "0.78rem" }}>
							{user?.login_email || user?.login_uname}
						</div>
					</div>
					<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-muted">
						<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
					</svg>
				</button>

				{open && (
					<div className="position-absolute bg-white border rounded-3 shadow-sm py-1" style={{ right: 0, top: "calc(100% + 6px)", minWidth: 220, zIndex: 200 }}>
						<div className="px-3 py-2 border-bottom">
							<div className="fw-semibold" style={{ fontSize: "0.9rem", color: "#36394b" }}>
								{user?.login_name}
							</div>
							<div className="text-muted" style={{ fontSize: "0.8rem" }}>
								@{user?.login_uname}
							</div>
							{user?.login_email && (
								<div className="text-muted" style={{ fontSize: "0.8rem" }}>
									{user.login_email}
								</div>
							)}
						</div>
						<button className="dropdown-item text-danger d-flex align-items-center gap-2 px-3 py-2" onClick={handleLogout} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
							<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
								<path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
								<path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
							</svg>
							Sign out
						</button>
					</div>
				)}
			</div>
		</nav>
	);
}
