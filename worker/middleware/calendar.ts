import { Context, Next } from 'hono';
import { AuthUser } from './auth';

// Calendar permission scopes
export const CAL_PERMISSIONS = {
	READ: 'cal:read',
	ADD_USER: 'cal:add:user',
	ADD_GLOBAL: 'cal:add:global',
	EDIT_USER: 'cal:edit:user',
	EDIT_GLOBAL: 'cal:edit:global',
	DELETE_USER: 'cal:delete:user',
	DELETE_GLOBAL: 'cal:delete:global',
} as const;

// Check if user has a specific calendar permission
export function hasCalPermission(
	permissions: string[] | undefined,
	scope: string
): boolean {
	return permissions?.includes(scope) ?? false;
}

// Check if user can read calendar
export function canReadCalendar(permissions: string[] | undefined): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.READ);
}

// Check if user can add reminders (user-level)
export function canAddUserReminder(permissions: string[] | undefined): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.ADD_USER);
}

// Check if user can add global reminders (admin)
export function canAddGlobalReminder(
	permissions: string[] | undefined
): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.ADD_GLOBAL);
}

// Check if user can edit their own reminders
export function canEditUserReminder(
	permissions: string[] | undefined
): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.EDIT_USER);
}

// Check if user can edit any reminder (admin)
export function canEditGlobalReminder(
	permissions: string[] | undefined
): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.EDIT_GLOBAL);
}

// Check if user can delete their own reminders
export function canDeleteUserReminder(
	permissions: string[] | undefined
): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.DELETE_USER);
}

// Check if user can delete any reminder (admin)
export function canDeleteGlobalReminder(
	permissions: string[] | undefined
): boolean {
	return hasCalPermission(permissions, CAL_PERMISSIONS.DELETE_GLOBAL);
}

// Check if user can add any reminder (user or global)
export function canAddAnyReminder(permissions: string[] | undefined): boolean {
	return (
		canAddUserReminder(permissions) || canAddGlobalReminder(permissions)
	);
}

// Middleware to require calendar read access
export function calendarReadMiddleware() {
	return async (
		c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
		next: Next
	) => {
		const user = c.get('user');

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!canReadCalendar(user.permissions)) {
			console.log(
				'[Calendar] Read access denied for:',
				user.email,
				'permissions:',
				user.permissions
			);
			return c.json({ error: 'Forbidden: Calendar read access required' }, 403);
		}

		await next();
	};
}

// Middleware to require at least one add permission (user or global)
export function calendarAddMiddleware() {
	return async (
		c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
		next: Next
	) => {
		const user = c.get('user');

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!canAddAnyReminder(user.permissions)) {
			console.log(
				'[Calendar] Add access denied for:',
				user.email,
				'permissions:',
				user.permissions
			);
			return c.json({ error: 'Forbidden: Calendar add access required' }, 403);
		}

		await next();
	};
}

// Get all calendar permissions for a user (for /api/auth/me response)
export function getCalendarPermissions(permissions: string[] | undefined): {
	canRead: boolean;
	canAddUser: boolean;
	canAddGlobal: boolean;
	canEditUser: boolean;
	canEditGlobal: boolean;
	canDeleteUser: boolean;
	canDeleteGlobal: boolean;
} {
	return {
		canRead: canReadCalendar(permissions),
		canAddUser: canAddUserReminder(permissions),
		canAddGlobal: canAddGlobalReminder(permissions),
		canEditUser: canEditUserReminder(permissions),
		canEditGlobal: canEditGlobalReminder(permissions),
		canDeleteUser: canDeleteUserReminder(permissions),
		canDeleteGlobal: canDeleteGlobalReminder(permissions),
	};
}
