import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import { logger } from "hono/logger";
import routes from "./routes";
// import { cors } from "hono/cors";

export function createApp() {
	const app = new Hono<{ Variables: JwtVariables }>();

	app.use(logger());
	// app.use("*", cors());
	app.route("/", routes);

	return app;
}
