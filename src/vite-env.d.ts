/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare const __APP_VERSION__: string;

// Feature flag environment variables
interface ImportMetaEnv {
	readonly FEATURE_ORGS?: string;
	readonly FEATURE_ADMIN_PANEL?: string;
	readonly FEATURE_SHARED_CONTENT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
