// Extend the Cloudflare.Env interface with variables loaded from Doppler/environment
// This merges with the generated worker-configuration.d.ts types
declare namespace Cloudflare {
	interface Env {
		AUTH0_DOMAIN: string; // e.g., https://tenant.auth0.com/
		AUTH0_CLIENT_ID: string;
		AUTH0_CLIENT_SECRET: string;
		AUTH0_AUDIENCE: string; // e.g., https://hub.unstablestudios.com/api
		ASSETS: Fetcher; // Static assets binding
		POSTMARK_API_KEY: string; // Postmark email API key
	}
}
