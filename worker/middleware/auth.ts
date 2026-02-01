import { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

// Extended JWT payload with Auth0 claims
export interface Auth0JWTPayload extends JWTPayload {
	sub: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
	permissions?: string[];
}

// User context attached to requests
export interface AuthUser {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
	permissions?: string[];
}

// Cache for JWKS - persists across requests in the same worker instance
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedIssuer: string | null = null;

// Normalize issuer URL (ensure trailing slash)
function normalizeIssuer(issuer: string): string {
	return issuer.endsWith('/') ? issuer : `${issuer}/`;
}

function getJWKS(env: Env): ReturnType<typeof createRemoteJWKSet> {
	const issuer = normalizeIssuer(env.AUTH0_DOMAIN);

	// Return cached JWKS if issuer hasn't changed
	if (cachedJWKS && cachedIssuer === issuer) {
		return cachedJWKS;
	}

	const jwksUri = `${issuer}.well-known/jwks.json`;
	console.log('[Auth] Creating JWKS set for:', jwksUri);

	cachedJWKS = createRemoteJWKSet(new URL(jwksUri));
	cachedIssuer = issuer;
	return cachedJWKS;
}

// Cache key for verified tokens - use signature portion for uniqueness
function getTokenCacheKey(token: string): string {
	// JWT format: header.payload.signature - the signature is unique per token
	const parts = token.split('.');
	if (parts.length === 3) {
		// Use signature (last part) which is unique and collision-resistant
		return `auth:token:${parts[2].slice(0, 43)}`; // ~256 bits of signature
	}
	// Fallback: use end of token (most unique part)
	return `auth:token:${token.slice(-43)}`;
}

// Token cache TTL - 5 minutes (tokens are typically valid for hours)
const TOKEN_CACHE_TTL = 300;

// Fetch user profile from Auth0 /userinfo endpoint
async function fetchUserInfo(
	token: string,
	issuer: string
): Promise<{ email?: string; name?: string; picture?: string } | null> {
	try {
		const userInfoUrl = `${issuer}userinfo`;
		console.log('[Auth] Fetching userinfo from:', userInfoUrl);
		const res = await fetch(userInfoUrl, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('[Auth] Failed to fetch userinfo:', res.status, text);
			return null;
		}

		const data = await res.json() as { email?: string; name?: string; picture?: string };
		console.log('[Auth] Userinfo response:', JSON.stringify(data));
		return data;
	} catch (error) {
		console.error('[Auth] Error fetching userinfo:', error);
		return null;
	}
}

export async function verifyToken(
	token: string,
	env: Env
): Promise<Auth0JWTPayload | null> {
	// Check KV cache first
	const cacheKey = getTokenCacheKey(token);
	try {
		const cached = await env.CACHE.get(cacheKey, 'json') as Auth0JWTPayload | null;
		// Only use cache if it has email (to avoid stale entries without user info)
		if (cached && cached.email) {
			return cached;
		}
	} catch {
		// Cache miss or error, continue with verification
	}

	try {
		const jwks = getJWKS(env);
		const issuer = normalizeIssuer(env.AUTH0_DOMAIN);

		const { payload } = await jwtVerify(token, jwks, {
			issuer,
			audience: env.AUTH0_APP_AUDIENCE,
		});

		let result = payload as Auth0JWTPayload;

		// If email is missing, fetch from userinfo endpoint
		if (!result.email) {
			const userInfo = await fetchUserInfo(token, issuer);
			if (userInfo) {
				result = {
					...result,
					email: userInfo.email,
					name: userInfo.name || result.name,
					picture: userInfo.picture || result.picture,
				};
			}
		}

		// Cache the verified token with user info
		try {
			await env.CACHE.put(cacheKey, JSON.stringify(result), {
				expirationTtl: TOKEN_CACHE_TTL,
			});
		} catch {
			// Caching failed, not critical
		}

		return result;
	} catch (error) {
		console.error('[Auth] Token verification failed:', error);
		return null;
	}
}

// Middleware to require authentication
export function authMiddleware() {
	return async (
		c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
		next: Next
	) => {
		const authHeader = c.req.header('Authorization');

		if (!authHeader?.startsWith('Bearer ')) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		const token = authHeader.slice(7);
		const payload = await verifyToken(token, c.env);

		if (!payload) {
			return c.json({ error: 'Invalid token' }, 401);
		}

		// Attach user to context
		c.set('user', {
			sub: payload.sub,
			email: payload.email || '',
			name: payload.name,
			picture: payload.picture,
			permissions: payload.permissions,
		});

		await next();
	};
}

// Optional auth - attaches user if token present, but doesn't require it
export function optionalAuthMiddleware() {
	return async (
		c: Context<{ Bindings: Env; Variables: { user?: AuthUser } }>,
		next: Next
	) => {
		const authHeader = c.req.header('Authorization');

		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.slice(7);
			const payload = await verifyToken(token, c.env);

			if (payload) {
				c.set('user', {
					sub: payload.sub,
					email: payload.email || '',
					name: payload.name,
					picture: payload.picture,
				});
			}
		}

		await next();
	};
}
