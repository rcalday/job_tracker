import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import API from "../api";

export interface AuthUser {
	login_id: number;
	login_name: string;
	login_uname: string;
	login_email: string | null;
}

interface AuthContextValue {
	user: AuthUser | null;
	isAuthenticated: boolean;
	loading: boolean;
	setUser: (user: AuthUser | null) => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await API.get("/auth/me");
				setUser(res.data.user);
			} catch {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, []);

	const logout = async () => {
		try {
			await API.post("/auth/logout");
		} catch {
			// ignore
		}
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				loading,
				setUser,
				logout,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
