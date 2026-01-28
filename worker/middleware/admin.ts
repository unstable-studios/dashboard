/**
 * Legacy admin middleware module.
 *
 * This module re-exports from the new granular permissions system for backward
 * compatibility. New code should import directly from './permissions'.
 */
import { Context, Next } from 'hono';
import { AuthUser } from './auth';
import {
	hasReadPermission,
	hasAdminPermission,
	LEGACY_PERMISSIONS,
} from './permissions';

// Re-export legacy permission helpers
export { hasReadPermission, hasAdminPermission };

/**
 * @deprecated Use granular permission middlewares from './permissions' instead.
 * Middleware to require read access via Auth0 RBAC.
 */
export function readerMiddleware() {
	return async (
		c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
		next: Next
	) => {
		const user = c.get('user');

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!user.permissions?.includes(LEGACY_PERMISSIONS.READ)) {
			console.log(
				'[Reader] Access denied for:',
				user.email,
				'permissions:',
				user.permissions
			);
			return c.json({ error: 'Forbidden: Read access required' }, 403);
		}

		await next();
	};
}

/**
 * @deprecated Use granular permission middlewares from './permissions' instead.
 * Middleware to require admin/edit access via Auth0 RBAC.
 */
export function adminMiddleware() {
	return async (
		c: Context<{
			Bindings: Env;
			Variables: { user: AuthUser; isAdmin: boolean };
		}>,
		next: Next
	) => {
		const user = c.get('user');

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!user.permissions?.includes(LEGACY_PERMISSIONS.EDIT)) {
			console.log(
				'[Admin] Access denied for:',
				user.email,
				'permissions:',
				user.permissions
			);
			return c.json({ error: 'Forbidden: Admin access required' }, 403);
		}

		console.log('[Admin] Access granted for:', user.email);
		c.set('isAdmin', true);
		await next();
	};
}
