// Extract domain from OIDC issuer URL (e.g., https://tenant.auth0.com/ -> tenant.auth0.com)
function extractDomain(issuerUrl: string): string {
	try {
		const url = new URL(issuerUrl);
		return url.host;
	} catch {
		// Fallback: assume it's already just a domain
		return issuerUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}
}

// All scopes to request from Auth0
const SCOPES = [
	// OpenID Connect
	'openid',
	'profile',
	'email',
	// Document scopes
	'docs:read',
	'docs:read:unpublished',
	'docs:edit',
	'docs:delete',
	// Link scopes
	'links:read',
	'links:edit',
	'links:delete',
	// Category scopes
	'categories:read',
	'categories:edit',
	'categories:delete',
	// Attachment scopes
	'attachments:read',
	'attachments:upload',
	'attachments:delete',
	// Preferences scopes
	'prefs:read',
	'prefs:edit',
	// Calendar scopes
	'cal:read',
	'cal:add:user',
	'cal:add:global',
	'cal:edit:user',
	'cal:edit:global',
	'cal:delete:user',
	'cal:delete:global',
].join(' ');

// Auth0 configuration for the frontend
export const auth0Config = {
	domain: extractDomain(import.meta.env.VITE_AUTH0_DOMAIN),
	clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
	authorizationParams: {
		redirect_uri: `${window.location.origin}/callback`,
		audience: import.meta.env.VITE_AUTH0_AUDIENCE,
		scope: SCOPES,
		organization: import.meta.env.VITE_AUTH0_ORGANIZATION,
	},
};

// Helper to get the access token for API calls
export async function getAccessToken(
	getAccessTokenSilently: () => Promise<string>
): Promise<string | null> {
	try {
		return await getAccessTokenSilently();
	} catch (error) {
		console.error('Failed to get access token:', error);
		return null;
	}
}

// Authenticated fetch wrapper
export async function authFetch(
	url: string,
	getAccessTokenSilently: () => Promise<string>,
	options: RequestInit = {}
): Promise<Response> {
	const token = await getAccessToken(getAccessTokenSilently);

	const headers = new Headers(options.headers);
	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	return fetch(url, {
		...options,
		headers,
	});
}
