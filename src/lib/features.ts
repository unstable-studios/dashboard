// Feature flags configuration
// These control which features are available in the app instance

export interface Features {
	// Organization features - when false, all content is personal/user-scoped only
	orgs: boolean;
	// Admin panel access - when false, /admin route is hidden
	adminPanel: boolean;
	// Shared links/docs - when false, each user only sees their own content
	// (For now, links/docs are org-level; this flag is for future per-user mode)
	sharedContent: boolean;
}

// Default features for personal tier
const DEFAULT_FEATURES: Features = {
	orgs: false,
	adminPanel: false,
	sharedContent: true, // Keep existing shared behavior for now
};

// Read features from environment variables
// Set in Doppler without prefix, Vite exposes as FEATURE_*
// FEATURE_ORGS=true enables organization features
// FEATURE_ADMIN_PANEL=true enables admin panel
// FEATURE_SHARED_CONTENT=true enables shared links/docs
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
	if (value === undefined || value === '') return defaultValue;
	return value.toLowerCase() === 'true' || value === '1';
}

export const features: Features = {
	orgs: parseBoolean(import.meta.env.FEATURE_ORGS, DEFAULT_FEATURES.orgs),
	adminPanel: parseBoolean(import.meta.env.FEATURE_ADMIN_PANEL, DEFAULT_FEATURES.adminPanel),
	sharedContent: parseBoolean(import.meta.env.FEATURE_SHARED_CONTENT, DEFAULT_FEATURES.sharedContent),
};

// Debug: Log features on load
if (import.meta.env.DEV) {
	console.log('[Features] Config:', features);
}
