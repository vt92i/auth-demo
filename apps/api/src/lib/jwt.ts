import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import { ENV } from "./env";

const JWT_ALG = "HS256";
const JWT_ISSUER = "Hono";
const JWT_AUDIENCE = "user";
const JWT_SECRET = new TextEncoder().encode(ENV.JWT_SECRET);

const ACCESS_TTL = "1m";
const ACCESS_TTL_MS = 1 * 60 * 1000;
const ACCESS_COOKIE = "access_token";
const REFRESH_TTL = "5m";
const REFRESH_TTL_MS = 5 * 60 * 1000;
const REFRESH_COOKIE = "refresh_token";
const CLOCK_TOLERANCE_SEC = 5;

type TokenType = "access" | "refresh";
type UserLike = { id: string; email: string };
type ClaimsBase = JWTPayload & {
	sub: string;
	email: string;
	typ: TokenType;
};

async function signToken(
	user: UserLike,
	token_type: TokenType,
	ttl: string,
): Promise<string> {
	const payload: ClaimsBase = {
		sub: user.id,
		email: user.email,
		typ: token_type,
	};

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: JWT_ALG })
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(ttl)
		.sign(JWT_SECRET);
}

async function verifyToken<T extends ClaimsBase = ClaimsBase>(
	token: string,
): Promise<T> {
	const { payload } = await jwtVerify(token, JWT_SECRET, {
		issuer: JWT_ISSUER,
		audience: JWT_AUDIENCE,
		clockTolerance: CLOCK_TOLERANCE_SEC,
	});

	return payload as T;
}

export const signAccessToken = (user: UserLike) =>
	signToken(user, "access", ACCESS_TTL);
export const signRefreshToken = (user: UserLike) =>
	signToken(user, "refresh", REFRESH_TTL);

export async function verifyAccessToken<T extends ClaimsBase = ClaimsBase>(
	token: string,
): Promise<T> {
	const payload = await verifyToken<T>(token);
	if (payload.typ !== "access") throw new Error("invalid token type");
	return payload;
}

export async function verifyRefreshToken<T extends ClaimsBase = ClaimsBase>(
	token: string,
): Promise<T> {
	const payload = await verifyToken<T>(token);
	if (payload.typ !== "refresh") throw new Error("invalid token type");
	return payload;
}

export function setAccessCookie(c: Context, token: string) {
	setCookie(c, ACCESS_COOKIE, token, {
		httpOnly: false,
		secure: false,
		sameSite: "Lax",
		path: "/",
		maxAge: ACCESS_TTL_MS,
	});
}

export function clearAccessCookie(c: Context) {
	deleteCookie(c, ACCESS_COOKIE);
}

export function getRefreshCookie(c: Context) {
	return getCookie(c, REFRESH_COOKIE);
}

export function setRefreshCookie(c: Context, token: string) {
	setCookie(c, REFRESH_COOKIE, token, {
		httpOnly: true,
		secure: false,
		sameSite: "Lax",
		path: "/auth/refresh",
		maxAge: REFRESH_TTL_MS,
	});
}

export function clearRefreshCookie(c: Context) {
	deleteCookie(c, REFRESH_COOKIE, { path: "/auth/refresh" });
}
