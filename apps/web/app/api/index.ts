import axios from "axios";

const API = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	withCredentials: true,
});

const login = async (email: string, password: string) => {
	const response = await API.post("/auth/login", { email, password });
	return response.data;
};

const register = async (email: string, password: string) => {
	const response = await API.post("/auth/register", { email, password });
	return response.data;
};

const logout = async () => {
	const response = await API.post("/auth/logout");
	return response.data;
};

const refreshToken = async () => {
	const response = await API.post("/auth/refresh");
	return response.data;
};

const getProfile = async () => {
	const response = await API.get("/me");
	return response.data;
};

export const apiClient = {
	login,
	register,
	logout,
	refreshToken,
	getProfile,
};
