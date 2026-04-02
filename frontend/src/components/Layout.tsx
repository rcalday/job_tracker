import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="app-shell">
			<Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
			<div className="app-body">
				{/* Mobile overlay */}
				<div className={`sidebar-overlay${sidebarOpen ? " sidebar-open" : ""}`} onClick={() => setSidebarOpen(false)} />
				<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				<main className="app-main">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
