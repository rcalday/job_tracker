import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobSearchPage from "./pages/JobSearchPage";
import NotFoundPage from "./pages/NotFoundPage";

function MainLayout({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean | null; setIsAuthenticated: (auth: boolean) => void }) {
	return (
		<div className="d-flex flex-column min-vh-100 bg-light">
			<main>
				<div className="container-fluid d-flex justify-content-center align-items-center p-0 m-0" style={{ minHeight: "calc(100vh - 72px)" }}>
					<div className="w-100 d-flex justify-content-center align-items-center" style={{ minHeight: "100%" }}>
						{/* <div className="bg-white rounded shadow-sm p-4 p-md-5 w-100" style={{ maxWidth: 420 }}> */}
						<Routes>
							<Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/search" element={isAuthenticated ? <JobSearchPage /> : <Navigate to="/login" replace />} />
							<Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
							<Route path="*" element={<NotFoundPage />} />
						</Routes>
						{/* </div> */}
					</div>
				</div>
			</main>
		</div>
	);
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		// Check authentication by calling backend /auth/me endpoint
		const checkAuth = async () => {
			try {
				const res = await fetch("http://localhost:3000/auth/me", {
					credentials: "include",
				});
				if (res.ok) {
					setIsAuthenticated(true);
				} else {
					setIsAuthenticated(false);
				}
			} catch {
				setIsAuthenticated(false);
			}
		};
		checkAuth();
	}, []);

	if (isAuthenticated === null) return null;

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
