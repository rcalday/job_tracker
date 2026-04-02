import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
	onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
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
		<nav className="app-navbar">
			{/* Hamburger — mobile only */}
			<button className="hamburger-btn" onClick={onMenuToggle} aria-label="Open menu">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>

			{/* Brand */}
			<a href="/dashboard" className="navbar-brand">
				<span className="navbar-brand-icon">💼</span>
				<span className="navbar-brand-text">Job Tracker</span>
			</a>

			<span className="navbar-spacer" />

			{/* User menu */}
			<div className="user-menu-wrap" ref={dropdownRef}>
				<button className="user-menu-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
					<div className="user-avatar">{initials}</div>
					<div style={{ textAlign: "left" }} className="d-none d-md-block">
						<div className="user-name">{user?.login_name}</div>
						<div className="user-email">{user?.login_email || `@${user?.login_uname}`}</div>
					</div>
					<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
						<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
					</svg>
				</button>

				{open && (
					<div className="user-dropdown">
						<div className="dropdown-header">
							<div className="name">{user?.login_name}</div>
							<div className="email">{user?.login_email || `@${user?.login_uname}`}</div>
						</div>
						<button className="dropdown-item-btn danger" onClick={handleLogout}>
							<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
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
