import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobSearchPage from "./pages/JobSearchPage";
import ResumeVaultPage from "./pages/ResumeVaultPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute() {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return null;
	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return null;
	return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AppRoutes() {
	return (
		<Routes>
			{/* Public routes */}
			<Route element={<PublicRoute />}>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
			</Route>

			{/* Protected routes with layout */}
			<Route element={<ProtectedRoute />}>
				<Route element={<Layout />}>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/search-jobs" element={<JobSearchPage />} />
					<Route path="/resume-vault" element={<ResumeVaultPage />} />
					<Route path="/my-applications" element={<MyApplicationsPage />} />
				</Route>
			</Route>

			{/* Root redirect */}
			<Route path="/" element={<RootRedirect />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

function RootRedirect() {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return null;
	return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
	return (
		<AuthProvider>
			<Router>
				<AppRoutes />
			</Router>
		</AuthProvider>
	);
}
