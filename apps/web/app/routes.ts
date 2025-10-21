import { prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("/dashboard", "routes/dashboard.tsx"),

	...prefix("/auth", [
		route("/login", "routes/auth/login.tsx"),
		route("/register", "routes/auth/register.tsx"),
		route("/logout", "routes/auth/logout.tsx"),
	]),

	route("", "routes/catchall.tsx"),
] satisfies RouteConfig;
