import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
	const location = useLocation();
	return (
		<nav className="col-12 col-md-3 col-lg-2 d-md-block bg-white sidebar shadow-sm p-0 position-relative" style={{ minHeight: "100vh", zIndex: 2 }}>
			<div className="d-flex flex-column align-items-start p-3 pt-4 gap-3 h-100">
				<Link to="/dashboard" className="navbar-brand d-flex align-items-center gap-2 mb-4">
					<span role="img" aria-label="logo">
						💼
					</span>
					<span className="fw-bold text-primary">Job Tracker</span>
				</Link>
				<ul className="nav nav-pills flex-column w-100 gap-2">
					<li className="nav-item">
						<Link to="/dashboard" className={`nav-link${location.pathname === "/dashboard" ? " active" : ""}`}>
							Dashboard
						</Link>
					</li>
					<li className="nav-item">
						<Link to="/search" className={`nav-link${location.pathname === "/search" ? " active" : ""}`}>
							Job Search
						</Link>
					</li>
					<li className="nav-item mt-auto">
						<a
							className="nav-link text-danger"
							href="/logout"
							onClick={(e) => {
								e.preventDefault();
								document.cookie = "accessToken=; Max-Age=0";
								document.cookie = "refreshToken=; Max-Age=0";
								window.location.href = "/login";
							}}>
							Logout
						</a>
					</li>
				</ul>
			</div>
		</nav>
	);
}
