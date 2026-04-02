import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

// ── Token storage ────────────────────────────────────────────────────────────
// Cookies work on desktop but are blocked cross-origin on iOS Safari (ITP).
// As a fallback, we keep the access token in memory (safe from XSS) and the
// refresh token in sessionStorage only — never localStorage — to limit the
// persistence window. On desktop, HttpOnly cookies handle "remember me";
// on mobile, re-login is required after the browser session ends (intentional
// security tradeoff vs. storing a long-lived token in persistent storage).

const RT_KEY = "_rt";
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
	_accessToken = token;
}

export function setRefreshToken(token: string | null, _remember?: boolean): void {
	sessionStorage.removeItem(RT_KEY);
	if (token) {
		sessionStorage.setItem(RT_KEY, token);
	}
}

export function getRefreshToken(): string | null {
	return sessionStorage.getItem(RT_KEY);
}

function isRememberMe(): boolean {
	return false; // RT is always in sessionStorage; desktop remember-me is handled by cookies
}

// ── Axios instance ───────────────────────────────────────────────────────────
const API = axios.create({
	baseURL: import.meta.env.VITE_DEVELOPMENT ? "http://localhost:3000" : import.meta.env.VITE_API_URL,
	withCredentials: true,
});

// Attach access token as Authorization header (fallback when cookies are blocked)
API.interceptors.request.use((config) => {
	if (_accessToken) {
		config.headers.Authorization = `Bearer ${_accessToken}`;
	}
	return config;
});

// Response interceptor for automatic token refresh
API.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as RetryAxiosRequestConfig;

		// Avoid refresh loop when refresh endpoint itself returns 401 or if login endpoint is called
		if (originalRequest?.url?.includes("/auth/refresh") || originalRequest?.url?.includes("/auth/login")) {
			return Promise.reject(error);
		}

		if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const storedRefreshToken = getRefreshToken();
				const response = await API.post<{ accessToken?: string; refreshToken?: string }>("/auth/refresh", storedRefreshToken ? { refreshToken: storedRefreshToken } : {});
				if (response.data.accessToken) setAccessToken(response.data.accessToken);
				if (response.data.refreshToken) setRefreshToken(response.data.refreshToken, isRememberMe());
				return API(originalRequest);
			} catch (refreshError) {
				console.error("Token refresh failed", refreshError);
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default API;
