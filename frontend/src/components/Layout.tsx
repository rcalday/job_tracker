import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
	return (
		<div className="d-flex flex-column" style={{ minHeight: "100vh", background: "#f7f8fa" }}>
			<Navbar />
			<div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
				<Sidebar />
				<main className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
