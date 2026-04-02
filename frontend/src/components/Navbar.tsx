interface NavbarProps {
	onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
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
				<img src="/job_tracker.png" alt="Job Tracker" className="navbar-brand-logo" />
			</a>
		</nav>
	);
}
