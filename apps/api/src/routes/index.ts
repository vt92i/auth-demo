import { zValidator } from "@hono/zod-validator";
import { RedisStore } from "@hono-rate-limiter/redis";
import { Redis } from "@upstash/redis";
import { password as BunPassword } from "bun";
import * as d from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { rateLimiter } from "hono-rate-limiter";
import * as z from "zod";
import * as schema from "../db/schema";
import { ENV } from "../lib/env";
import {
	clearAccessCookie,
	clearRefreshCookie,
	getRefreshCookie,
	setAccessCookie,
	setRefreshCookie,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "../lib/jwt";

const db = drizzle({ schema, connection: ENV.DATABASE_URL });
const r = new Hono();

r.get("/", (c) => c.text("OK"));

r.post(
	"/auth/register",
	zValidator(
		"json",
		z.object({
			email: z.email(),
			password: z.string().min(8),
		}),
		(result, c) => {
			if (!result.success)
				return c.json(
					{ error: result.error.issues[0]?.message.toLowerCase() },
					422,
				);
		},
	),
	async (c) => {
		const { email, password } = c.req.valid("json");

		const existingUser = await db
			.select()
			.from(schema.users)
			.where(d.eq(schema.users.email, email.toLowerCase()))
			.limit(1);

		if (existingUser.length > 0)
			return c.json({ error: "user already exists" }, 409);

		const status = await db.insert(schema.users).values({
			email: email.toLowerCase(),
			password: await BunPassword.hash(password),
		});

		if (!status) return c.json({ error: "failed to create user" }, 500);

		return c.json({ ok: true });
	},
);

r.post(
	"/auth/login",
	zValidator(
		"json",
		z.object({
			email: z.email(),
			password: z.string().min(8),
		}),
		(result, c) => {
			if (!result.success)
				return c.json(
					{ error: result.error.issues[0]?.message.toLowerCase() },
					422,
				);
		},
	),
	rateLimiter({
		windowMs: 1 * 60 * 1000, // 1 minute
		limit: 5,
		standardHeaders: "draft-6",
		keyGenerator: (c) =>
			// @ts-expect-error
			c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
			c.req.header("user-agent"),
		store: new RedisStore({
			client: new Redis({
				url: ENV.UPSTASH_REDIS_REST_URL,
				token: ENV.UPSTASH_REDIS_REST_TOKEN,
			}),
		}),
	}),
	async (c) => {
		const { email, password } = c.req.valid("json");

		const existingUser = await db
			.select()
			.from(schema.users)
			.where(d.eq(schema.users.email, email.toLowerCase()))
			.limit(1);

		if (existingUser.length === 0)
			return c.json({ error: "invalid credentials" }, 401);

		const user = existingUser[0];

		const validPassword = await BunPassword.verify(password, user.password);
		if (!validPassword) return c.json({ error: "invalid credentials" }, 401);

		const accessToken = await signAccessToken({
			id: user.id,
			email: user.email,
		});

		const refreshToken = await signRefreshToken({
			id: user.id,
			email: user.email,
		});

		setAccessCookie(c, accessToken);
		setRefreshCookie(c, refreshToken);

		return c.json({ access_token: accessToken });
	},
);

r.post("/auth/logout", (c) => {
	clearAccessCookie(c);
	clearRefreshCookie(c);

	return c.json({ ok: true });
});

r.post("/auth/refresh", async (c) => {
	const refreshToken = getRefreshCookie(c);
	if (!refreshToken) return c.json({ error: "missing session" }, 401);

	const isValidRefreshToken = await verifyRefreshToken(refreshToken);
	if (!isValidRefreshToken) return c.json({ error: "invalid token" }, 401);

	const accessToken = await signAccessToken({
		id: isValidRefreshToken.sub,
		email: isValidRefreshToken.email,
	});

	const newRefreshToken = await signRefreshToken({
		id: isValidRefreshToken.sub,
		email: isValidRefreshToken.email,
	});

	setAccessCookie(c, accessToken);
	setRefreshCookie(c, newRefreshToken);

	return c.json({ access_token: accessToken });
});

r.get("/me", jwt({ secret: ENV.JWT_SECRET, cookie: "access_token" }), (c) => {
	const payload = c.get("jwtPayload");
	return c.json(payload);
});

export default r;
