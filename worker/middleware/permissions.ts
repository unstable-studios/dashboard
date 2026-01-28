import { Context, Next } from 'hono';
import { AuthUser } from './auth';

// =============================================================================
// Scope Constants
// =============================================================================

// Legacy scopes (kept for backward compatibility)
export const LEGACY_PERMISSIONS = {
	READ: 'hub:read',
	EDIT: 'hub:edit',
} as const;

// Document scopes
export const DOCS_PERMISSIONS = {
	READ: 'docs:read',
	READ_UNPUBLISHED: 'docs:read:unpublished',
	EDIT: 'docs:edit',
	DELETE: 'docs:delete',
} as const;

// Link scopes
export const LINKS_PERMISSIONS = {
	READ: 'links:read',
	EDIT: 'links:edit',
	DELETE: 'links:delete',
} as const;

// Category scopes
export const CATEGORIES_PERMISSIONS = {
	READ: 'categories:read',
	EDIT: 'categories:edit',
	DELETE: 'categories:delete',
} as const;

// Attachment scopes
export const ATTACHMENTS_PERMISSIONS = {
	READ: 'attachments:read',
	UPLOAD: 'attachments:upload',
	DELETE: 'attachments:delete',
} as const;

// Preferences scopes
export const PREFS_PERMISSIONS = {
	READ: 'prefs:read',
	EDIT: 'prefs:edit',
} as const;

// =============================================================================
// Permission Check Helpers
// =============================================================================

/**
 * Check if user has a specific permission.
 */
export function hasPermission(
	permissions: string[] | undefined,
	scope: string
): boolean {
	return permissions?.includes(scope) ?? false;
}

/**
 * Check if user has any of the specified permissions.
 */
export function hasAnyPermission(
	permissions: string[] | undefined,
	scopes: string[]
): boolean {
	return scopes.some((scope) => hasPermission(permissions, scope));
}

// =============================================================================
// Document Permission Helpers
// =============================================================================

export function canReadDocs(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		DOCS_PERMISSIONS.READ,
		LEGACY_PERMISSIONS.READ,
	]);
}

export function canReadUnpublishedDocs(
	permissions: string[] | undefined
): boolean {
	return hasAnyPermission(permissions, [
		DOCS_PERMISSIONS.READ_UNPUBLISHED,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

export function canEditDocs(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		DOCS_PERMISSIONS.EDIT,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

export function canDeleteDocs(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		DOCS_PERMISSIONS.DELETE,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

// =============================================================================
// Link Permission Helpers
// =============================================================================

export function canReadLinks(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		LINKS_PERMISSIONS.READ,
		LEGACY_PERMISSIONS.READ,
	]);
}

export function canEditLinks(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		LINKS_PERMISSIONS.EDIT,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

export function canDeleteLinks(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		LINKS_PERMISSIONS.DELETE,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

// =============================================================================
// Category Permission Helpers
// =============================================================================

export function canReadCategories(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		CATEGORIES_PERMISSIONS.READ,
		LEGACY_PERMISSIONS.READ,
	]);
}

export function canEditCategories(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		CATEGORIES_PERMISSIONS.EDIT,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

export function canDeleteCategories(
	permissions: string[] | undefined
): boolean {
	return hasAnyPermission(permissions, [
		CATEGORIES_PERMISSIONS.DELETE,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

// =============================================================================
// Attachment Permission Helpers
// =============================================================================

export function canReadAttachments(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		ATTACHMENTS_PERMISSIONS.READ,
		LEGACY_PERMISSIONS.READ,
	]);
}

export function canUploadAttachments(
	permissions: string[] | undefined
): boolean {
	return hasAnyPermission(permissions, [
		ATTACHMENTS_PERMISSIONS.UPLOAD,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

export function canDeleteAttachments(
	permissions: string[] | undefined
): boolean {
	return hasAnyPermission(permissions, [
		ATTACHMENTS_PERMISSIONS.DELETE,
		LEGACY_PERMISSIONS.EDIT,
	]);
}

// =============================================================================
// Preferences Permission Helpers
// =============================================================================

export function canReadPrefs(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		PREFS_PERMISSIONS.READ,
		LEGACY_PERMISSIONS.READ,
	]);
}

export function canEditPrefs(permissions: string[] | undefined): boolean {
	return hasAnyPermission(permissions, [
		PREFS_PERMISSIONS.EDIT,
		LEGACY_PERMISSIONS.READ, // Note: users with hub:read can edit their own prefs
	]);
}

// =============================================================================
// Legacy Permission Helpers (for backward compatibility)
// =============================================================================

export function hasReadPermission(permissions: string[] | undefined): boolean {
	return hasPermission(permissions, LEGACY_PERMISSIONS.READ);
}

export function hasAdminPermission(permissions: string[] | undefined): boolean {
	return hasPermission(permissions, LEGACY_PERMISSIONS.EDIT);
}

// =============================================================================
// Middleware Factories
// =============================================================================

type HonoContext = Context<{ Bindings: Env; Variables: { user: AuthUser } }>;

/**
 * Create a permission middleware that checks for a specific permission.
 */
function createPermissionMiddleware(
	checkFn: (permissions: string[] | undefined) => boolean,
	errorMessage: string
) {
	return () => {
		return async (c: HonoContext, next: Next) => {
			const user = c.get('user');

			if (!user) {
				return c.json({ error: 'Unauthorized' }, 401);
			}

			if (!checkFn(user.permissions)) {
				console.log(
					`[Permissions] Access denied for: ${user.email}, permissions: ${user.permissions?.join(', ')}`
				);
				return c.json({ error: `Forbidden: ${errorMessage}` }, 403);
			}

			await next();
		};
	};
}

// Document middlewares
export const docsReadMiddleware = createPermissionMiddleware(
	canReadDocs,
	'Document read access required'
);

export const docsReadUnpublishedMiddleware = createPermissionMiddleware(
	canReadUnpublishedDocs,
	'Unpublished document access required'
);

export const docsEditMiddleware = createPermissionMiddleware(
	canEditDocs,
	'Document edit access required'
);

export const docsDeleteMiddleware = createPermissionMiddleware(
	canDeleteDocs,
	'Document delete access required'
);

// Link middlewares
export const linksReadMiddleware = createPermissionMiddleware(
	canReadLinks,
	'Link read access required'
);

export const linksEditMiddleware = createPermissionMiddleware(
	canEditLinks,
	'Link edit access required'
);

export const linksDeleteMiddleware = createPermissionMiddleware(
	canDeleteLinks,
	'Link delete access required'
);

// Category middlewares
export const categoriesReadMiddleware = createPermissionMiddleware(
	canReadCategories,
	'Category read access required'
);

export const categoriesEditMiddleware = createPermissionMiddleware(
	canEditCategories,
	'Category edit access required'
);

export const categoriesDeleteMiddleware = createPermissionMiddleware(
	canDeleteCategories,
	'Category delete access required'
);

// Attachment middlewares
export const attachmentsReadMiddleware = createPermissionMiddleware(
	canReadAttachments,
	'Attachment read access required'
);

export const attachmentsUploadMiddleware = createPermissionMiddleware(
	canUploadAttachments,
	'Attachment upload access required'
);

export const attachmentsDeleteMiddleware = createPermissionMiddleware(
	canDeleteAttachments,
	'Attachment delete access required'
);

// Preferences middlewares
export const prefsReadMiddleware = createPermissionMiddleware(
	canReadPrefs,
	'Preferences read access required'
);

export const prefsEditMiddleware = createPermissionMiddleware(
	canEditPrefs,
	'Preferences edit access required'
);

// =============================================================================
// Hub Permissions Aggregator (for /api/auth/me response)
// =============================================================================

export interface HubPermissions {
	docs: {
		canRead: boolean;
		canReadUnpublished: boolean;
		canEdit: boolean;
		canDelete: boolean;
	};
	links: {
		canRead: boolean;
		canEdit: boolean;
		canDelete: boolean;
	};
	categories: {
		canRead: boolean;
		canEdit: boolean;
		canDelete: boolean;
	};
	attachments: {
		canRead: boolean;
		canUpload: boolean;
		canDelete: boolean;
	};
	prefs: {
		canRead: boolean;
		canEdit: boolean;
	};
}

export function getHubPermissions(
	permissions: string[] | undefined
): HubPermissions {
	return {
		docs: {
			canRead: canReadDocs(permissions),
			canReadUnpublished: canReadUnpublishedDocs(permissions),
			canEdit: canEditDocs(permissions),
			canDelete: canDeleteDocs(permissions),
		},
		links: {
			canRead: canReadLinks(permissions),
			canEdit: canEditLinks(permissions),
			canDelete: canDeleteLinks(permissions),
		},
		categories: {
			canRead: canReadCategories(permissions),
			canEdit: canEditCategories(permissions),
			canDelete: canDeleteCategories(permissions),
		},
		attachments: {
			canRead: canReadAttachments(permissions),
			canUpload: canUploadAttachments(permissions),
			canDelete: canDeleteAttachments(permissions),
		},
		prefs: {
			canRead: canReadPrefs(permissions),
			canEdit: canEditPrefs(permissions),
		},
	};
}
