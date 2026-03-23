import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobSearchPage from "./pages/JobSearchPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		fetch("http://localhost:3000/auth/me", {
			credentials: "include",
		})
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((data) => setIsAuthenticated(!!data.user))
			.catch(() => setIsAuthenticated(false));
	}, []);

	if (isAuthenticated === null) return <div>Loading...</div>;

	return (
		<Router>
			<Routes>
				<Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} />
				<Route path="/search" element={isAuthenticated ? <JobSearchPage /> : <Navigate to="/login" replace />} />
				<Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</Router>
	);
}

export default App;
