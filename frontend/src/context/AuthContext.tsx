import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

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
				const res = await fetch("http://localhost:3000/auth/me", {
					credentials: "include",
				});
				if (res.ok) {
					const data = await res.json();
					setUser(data.user);
				} else {
					setUser(null);
				}
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
			await fetch("http://localhost:3000/auth/logout", {
				method: "POST",
				credentials: "include",
			});
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
