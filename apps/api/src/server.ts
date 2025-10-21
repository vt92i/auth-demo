import { createApp } from "./app";
import { ENV } from "./lib/env";

const app = createApp();

Bun.serve({
	port: Number(ENV.PORT),
	fetch: app.fetch,
});
