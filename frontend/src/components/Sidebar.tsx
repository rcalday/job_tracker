import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const navLinks = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: (
			<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z" />
				<path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z" />
			</svg>
		),
	},
	{
		to: "/search-jobs",
		label: "Search Jobs",
		icon: (
			<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
				<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
			</svg>
		),
	},
	{
		to: "/resume-vault",
		label: "Resume Vault",
		icon: (
			<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
				<path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
				<path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
			</svg>
		),
	},
	{
		to: "/my-applications",
		label: "My Applications",
		icon: (
			<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
				<path d="M6 1a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V2a1 1 0 0 0-1-1H6zM5 3V2h6v1H5zm-1 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
			</svg>
		),
	},
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
	const location = useLocation();
	return (
		<nav className={`app-sidebar${isOpen ? " sidebar-open" : ""}`}>
			{/* Mobile header with close button */}
			<div className="sidebar-mobile-header">
				<span style={{ fontWeight: 700, fontSize: "1rem" }}>Menu</span>
				<button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close menu">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<ul className="sidebar-nav">
				<li className="sidebar-nav-label">Navigation</li>
				{navLinks.map((link) => (
					<li key={link.to}>
						<Link to={link.to} className={`sidebar-link${location.pathname === link.to ? " active" : ""}`} onClick={onClose}>
							{link.icon}
							{link.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
