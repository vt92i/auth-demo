import { z } from "zod";

const EnvSchema = z.object({
	DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	UPSTASH_REDIS_REST_URL: z.url("UPSTASH_REDIS_REST_URL must be a valid URL"),
	UPSTASH_REDIS_REST_TOKEN: z
		.string()
		.min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
	PORT: z.coerce.number().int().positive().default(3000),
});

const result = EnvSchema.safeParse(Bun.env);
if (!result.success) process.exit(1);

export const ENV = result.data;
