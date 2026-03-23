import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobSearchPage from "./pages/JobSearchPage";
import NotFoundPage from "./pages/NotFoundPage";

function MainLayout({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean | null; setIsAuthenticated: (auth: boolean) => void }) {
	return (
		<div className="main-bg">
			<header className="main-header">
				<div className="header-content">
					<div className="logo">
						<span role="img" aria-label="logo" className="logo-icon">
							💼
						</span>
						<span className="site-title">Job Tracker</span>
					</div>

					<nav className="main-nav">
						<ul>
							{isAuthenticated ? (
								<>
									<li>
										<a href="/dashboard">Dashboard</a>
									</li>
									<li>
										<a href="/search">Job Search</a>
									</li>
									<li>
										<a
											href="/logout"
											onClick={(e) => {
												e.preventDefault();
												document.cookie = "accessToken=; Max-Age=0";
												document.cookie = "refreshToken=; Max-Age=0";
												setIsAuthenticated(false);
												window.location.href = "/login";
											}}>
											Logout
										</a>
									</li>
								</>
							) : (
								<>
									<li>
										<a href="/login">Login</a>
									</li>
									<li>
										<a href="/register">Register</a>
									</li>
								</>
							)}
						</ul>
					</nav>
				</div>
			</header>

			<main className="main-content">
				<div className="content-card">
					<Routes>
						<Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
						<Route path="/register" element={<RegisterPage />} />
						<Route path="/search" element={isAuthenticated ? <JobSearchPage /> : <Navigate to="/login" replace />} />
						<Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
						<Route path="*" element={<NotFoundPage />} />
					</Routes>
				</div>
			</main>
		</div>
	);
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		// simple auth check via cookie
		const hasToken = document.cookie.includes("accessToken=");
		setIsAuthenticated(hasToken);
	}, []);

	if (isAuthenticated === null) return null; // or loading spinner

	return (
		<Router>
			<Routes>
				<Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} />
				<Route path="*" element={<MainLayout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
			</Routes>
		</Router>
	);
}

export default App;
