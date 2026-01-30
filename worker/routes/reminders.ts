import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	calendarReadMiddleware,
	calendarAddMiddleware,
	canAddUserReminder,
	canAddGlobalReminder,
	canEditUserReminder,
	canEditGlobalReminder,
	canDeleteUserReminder,
	canDeleteGlobalReminder,
} from '../middleware/calendar';

// RRULE validation: must start with FREQ= and contain only safe characters
const RRULE_PATTERN = /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Za-z0-9,]+)*$/;

// Character limits for reminder fields
const CHAR_LIMITS = {
	title: 100,
	description: 500,
} as const;

function isValidRRule(rrule: string): boolean {
	return RRULE_PATTERN.test(rrule);
}

// Validate advance_notice_days is within reasonable bounds
function isValidAdvanceNoticeDays(days: number): boolean {
	return Number.isInteger(days) && days >= 0 && days <= 365;
}

// Validate character limits for title and description
function validateCharacterLimits(
	title: string | undefined,
	description: string | undefined
): string | null {
	if (title && title.length > CHAR_LIMITS.title) {
		return `Title must not exceed ${CHAR_LIMITS.title} characters`;
	}
	if (description && description.length > CHAR_LIMITS.description) {
		return `Description must not exceed ${CHAR_LIMITS.description} characters`;
	}
	return null;
}

interface Variables {
	user: AuthUser;
}

const reminders = new Hono<{ Bindings: Env; Variables: Variables }>();

// List reminders (user's own + global) with user state
reminders.get(
	'/',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const user = c.get('user');

		const { results } = await c.env.DB.prepare(
			`SELECT r.*, d.title as doc_title, d.slug as doc_slug,
					rus.snoozed, rus.ignored, rus.completed, rus.actioned_at
			 FROM reminders r
			 LEFT JOIN documents d ON r.doc_id = d.id
			 LEFT JOIN reminder_user_state rus ON rus.reminder_id = r.id
				AND rus.user_id = ? AND rus.occurrence_date = r.next_due
			 WHERE (r.owner_id = ? OR r.is_global = 1)
			   AND COALESCE(rus.completed, 0) = 0
			   AND COALESCE(rus.ignored, 0) = 0
			   AND COALESCE(rus.snoozed, 0) = 0
			 ORDER BY r.next_due ASC`
		)
			.bind(user.sub, user.sub)
			.all();

		return c.json({ reminders: results });
	}
);

// Get snoozed reminders
reminders.get(
	'/snoozed',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const user = c.get('user');

		const { results } = await c.env.DB.prepare(
			`SELECT r.*, d.title as doc_title, d.slug as doc_slug,
					rus.snoozed, rus.ignored, rus.completed, rus.actioned_at
			 FROM reminders r
			 LEFT JOIN documents d ON r.doc_id = d.id
			 INNER JOIN reminder_user_state rus ON rus.reminder_id = r.id
				AND rus.user_id = ? AND rus.occurrence_date = r.next_due
			 WHERE (r.owner_id = ? OR r.is_global = 1)
			   AND rus.snoozed = 1
			   AND COALESCE(rus.completed, 0) = 0
			   AND COALESCE(rus.ignored, 0) = 0
			 ORDER BY r.next_due ASC`
		)
			.bind(user.sub, user.sub)
			.all();

		return c.json({ reminders: results });
	}
);

// Get history of completed/dismissed reminders (last 90 days)
reminders.get(
	'/history',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const user = c.get('user');

		const { results } = await c.env.DB.prepare(
			`SELECT r.id, r.title, r.description, r.rrule, r.advance_notice_days,
					r.doc_id, r.is_global, r.owner_id, r.created_at, r.updated_at,
					d.title as doc_title, d.slug as doc_slug,
					rus.occurrence_date as next_due,
					rus.completed, rus.ignored, rus.snoozed, rus.actioned_at
			 FROM reminder_user_state rus
			 INNER JOIN reminders r ON rus.reminder_id = r.id
			 LEFT JOIN documents d ON r.doc_id = d.id
			 WHERE rus.user_id = ?
			   AND (rus.completed = 1 OR rus.ignored = 1)
			   AND rus.actioned_at >= date('now', '-90 days')
			   AND (r.owner_id = ? OR r.is_global = 1)
			 ORDER BY rus.actioned_at DESC`
		)
			.bind(user.sub, user.sub)
			.all();

		return c.json({ reminders: results });
	}
);

// Get single reminder with user state
reminders.get(
	'/:id',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		const reminder = await c.env.DB.prepare(
			`SELECT r.*, d.title as doc_title, d.slug as doc_slug,
					rus.snoozed, rus.ignored, rus.completed, rus.actioned_at
			 FROM reminders r
			 LEFT JOIN documents d ON r.doc_id = d.id
			 LEFT JOIN reminder_user_state rus ON rus.reminder_id = r.id
				AND rus.user_id = ? AND rus.occurrence_date = r.next_due
			 WHERE r.id = ? AND (r.owner_id = ? OR r.is_global = 1)`
		)
			.bind(user.sub, id, user.sub)
			.first();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		return c.json({ reminder });
	}
);

// Create reminder (requires at least one add permission)
reminders.post('/', authMiddleware(), calendarAddMiddleware(), async (c) => {
	const user = c.get('user');
	const body = await c.req.json<{
		title: string;
		description?: string;
		rrule?: string;
		next_due: string;
		advance_notice_days?: number;
		doc_id?: number;
		is_global?: boolean;
	}>();

	if (!body.title || !body.next_due) {
		return c.json({ error: 'Title and next_due are required' }, 400);
	}

	// Validate character limits
	const charLimitError = validateCharacterLimits(body.title, body.description);
	if (charLimitError) {
		return c.json({ error: charLimitError }, 400);
	}

	// Check permissions based on is_global flag
	const isGlobal = body.is_global ?? false;
	if (isGlobal) {
		if (!canAddGlobalReminder(user.permissions)) {
			return c.json(
				{ error: 'Forbidden: Cannot create global reminders' },
				403
			);
		}
	} else {
		if (!canAddUserReminder(user.permissions)) {
			return c.json({ error: 'Forbidden: Cannot create reminders' }, 403);
		}
	}

	// Validate date format
	if (!/^\d{4}-\d{2}-\d{2}$/.test(body.next_due)) {
		return c.json({ error: 'next_due must be in YYYY-MM-DD format' }, 400);
	}

	// Validate RRULE format if provided
	if (body.rrule && !isValidRRule(body.rrule)) {
		return c.json(
			{ error: 'Invalid RRULE format. Must be a valid RFC 5545 recurrence rule.' },
			400
		);
	}

	// Validate advance_notice_days if provided
	const advanceNoticeDays = body.advance_notice_days ?? 7;
	if (!isValidAdvanceNoticeDays(advanceNoticeDays)) {
		return c.json(
			{ error: 'advance_notice_days must be an integer between 0 and 365' },
			400
		);
	}

	// Validate doc_id exists if provided
	if (body.doc_id) {
		const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE id = ?')
			.bind(body.doc_id)
			.first();
		if (!doc) {
			return c.json({ error: 'Document not found' }, 404);
		}
	}

	const result = await c.env.DB.prepare(
		`INSERT INTO reminders (title, description, rrule, next_due, advance_notice_days, doc_id, is_global, owner_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			body.title,
			body.description || null,
			body.rrule || null,
			body.next_due,
			advanceNoticeDays,
			body.doc_id || null,
			isGlobal ? 1 : 0,
			user.sub
		)
		.run();

	return c.json({ success: true, id: result.meta.last_row_id }, 201);
});

// Update reminder (permission check done in handler based on ownership)
reminders.put(
	'/:id',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');
		const body = await c.req.json<{
			title?: string;
			description?: string;
			rrule?: string | null;
			next_due?: string;
			advance_notice_days?: number;
			doc_id?: number | null;
			is_global?: boolean;
		}>();

		// Fetch existing reminder
		const existing = await c.env.DB.prepare(
			'SELECT * FROM reminders WHERE id = ?'
		)
			.bind(id)
			.first();

		if (!existing) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Check permissions
		const isOwner = existing.owner_id === user.sub;
		const isGlobal = existing.is_global === 1;

		if (isGlobal || !isOwner) {
			// Need global edit permission
			if (!canEditGlobalReminder(user.permissions)) {
				return c.json({ error: 'Forbidden: Cannot edit this reminder' }, 403);
			}
		} else {
			// Own reminder - need user edit permission
			if (!canEditUserReminder(user.permissions)) {
				return c.json({ error: 'Forbidden: Cannot edit reminders' }, 403);
			}
		}

		// If changing to global, check global add permission
		if (body.is_global && !isGlobal) {
			if (!canAddGlobalReminder(user.permissions)) {
				return c.json(
					{ error: 'Forbidden: Cannot make reminder global' },
					403
				);
			}
		}

		// Validate character limits
		const charLimitError = validateCharacterLimits(body.title, body.description);
		if (charLimitError) {
			return c.json({ error: charLimitError }, 400);
		}

		// Validate date format if provided
		if (body.next_due && !/^\d{4}-\d{2}-\d{2}$/.test(body.next_due)) {
			return c.json({ error: 'next_due must be in YYYY-MM-DD format' }, 400);
		}

		// Validate RRULE format if provided
		if (body.rrule && !isValidRRule(body.rrule)) {
			return c.json(
				{ error: 'Invalid RRULE format. Must be a valid RFC 5545 recurrence rule.' },
				400
			);
		}

		// Validate advance_notice_days if provided
		if (
			body.advance_notice_days !== undefined &&
			!isValidAdvanceNoticeDays(body.advance_notice_days)
		) {
			return c.json(
				{ error: 'advance_notice_days must be an integer between 0 and 365' },
				400
			);
		}

		// Validate doc_id exists if provided
		if (body.doc_id) {
			const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE id = ?')
				.bind(body.doc_id)
				.first();
			if (!doc) {
				return c.json({ error: 'Document not found' }, 404);
			}
		}

		await c.env.DB.prepare(
			`UPDATE reminders SET
				title = ?, description = ?, rrule = ?, next_due = ?,
				advance_notice_days = ?, doc_id = ?, is_global = ?,
				updated_at = CURRENT_TIMESTAMP
			 WHERE id = ?`
		)
			.bind(
				body.title ?? existing.title,
				body.description !== undefined ? body.description : existing.description,
				body.rrule !== undefined ? body.rrule : existing.rrule,
				body.next_due ?? existing.next_due,
				body.advance_notice_days ?? existing.advance_notice_days,
				body.doc_id !== undefined ? body.doc_id : existing.doc_id,
				body.is_global !== undefined
					? body.is_global
						? 1
						: 0
					: existing.is_global,
				id
			)
			.run();

		return c.json({ success: true, id: Number(id) });
	}
);

// Delete reminder (permission check done in handler based on ownership)
reminders.delete(
	'/:id',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Fetch existing reminder
		const existing = await c.env.DB.prepare(
			'SELECT * FROM reminders WHERE id = ?'
		)
			.bind(id)
			.first();

		if (!existing) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Check permissions
		const isOwner = existing.owner_id === user.sub;
		const isGlobal = existing.is_global === 1;

		if (isGlobal || !isOwner) {
			// Need global delete permission
			if (!canDeleteGlobalReminder(user.permissions)) {
				return c.json(
					{ error: 'Forbidden: Cannot delete this reminder' },
					403
				);
			}
		} else {
			// Own reminder - need user delete permission
			if (!canDeleteUserReminder(user.permissions)) {
				return c.json({ error: 'Forbidden: Cannot delete reminders' }, 403);
			}
		}

		await c.env.DB.prepare('DELETE FROM reminders WHERE id = ?').bind(id).run();

		return c.json({ success: true });
	}
);

// Helper to get today's date in YYYY-MM-DD format
function getToday(): string {
	return new Date().toISOString().split('T')[0];
}

// Calculate next occurrence from RRULE
function calculateNextOccurrence(rrule: string, currentDue: string): string | null {
	const current = new Date(currentDue + 'T00:00:00Z');

	// Parse RRULE components
	const parts = rrule.split(';').reduce(
		(acc, part) => {
			const [key, value] = part.split('=');
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>
	);

	const freq = parts['FREQ'];
	const interval = parseInt(parts['INTERVAL'] || '1', 10);

	switch (freq) {
		case 'DAILY':
			current.setUTCDate(current.getUTCDate() + interval);
			break;
		case 'WEEKLY':
			current.setUTCDate(current.getUTCDate() + 7 * interval);
			break;
		case 'MONTHLY':
			current.setUTCMonth(current.getUTCMonth() + interval);
			break;
		case 'YEARLY':
			current.setUTCFullYear(current.getUTCFullYear() + interval);
			break;
		default:
			return null;
	}

	return current.toISOString().split('T')[0];
}

// Snooze a reminder (no emails until due date)
reminders.post(
	'/:id/snooze',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Can't snooze if due today
		const today = getToday();
		if (reminder.next_due === today) {
			return c.json(
				{ error: 'Cannot snooze a reminder that is due today' },
				400
			);
		}

		// Set snoozed state
		await c.env.DB.prepare(
			`INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored)
			 VALUES (?, ?, ?, 1, 0)
			 ON CONFLICT (user_id, reminder_id, occurrence_date)
			 DO UPDATE SET snoozed = 1`
		)
			.bind(user.sub, reminder.id, reminder.next_due)
			.run();

		return c.json({ success: true, snoozed: true });
	}
);

// Remove snooze from a reminder
reminders.delete(
	'/:id/snooze',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Remove snoozed state
		await c.env.DB.prepare(
			`UPDATE reminder_user_state SET snoozed = 0
			 WHERE user_id = ? AND reminder_id = ? AND occurrence_date = ?`
		)
			.bind(user.sub, reminder.id, reminder.next_due)
			.run();

		return c.json({ success: true, snoozed: false });
	}
);

// Ignore/Dismiss a reminder occurrence (no more emails for this occurrence)
reminders.post(
	'/:id/ignore',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due, rrule FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string; rrule: string | null }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		const now = new Date().toISOString();

		// Set ignored state with actioned_at timestamp
		await c.env.DB.prepare(
			`INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored, completed, actioned_at)
			 VALUES (?, ?, ?, 0, 1, 0, ?)
			 ON CONFLICT (user_id, reminder_id, occurrence_date)
			 DO UPDATE SET ignored = 1, actioned_at = ?`
		)
			.bind(user.sub, reminder.id, reminder.next_due, now, now)
			.run();

		// If recurring, advance to next occurrence
		let nextDue: string | null = null;
		if (reminder.rrule) {
			nextDue = calculateNextOccurrence(reminder.rrule, reminder.next_due);
			if (nextDue) {
				await c.env.DB.prepare(
					`UPDATE reminders SET next_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
				)
					.bind(nextDue, reminder.id)
					.run();
			}
		}

		return c.json({ success: true, ignored: true, next_due: nextDue });
	}
);

// Remove ignore from a reminder
reminders.delete(
	'/:id/ignore',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Remove ignored state
		await c.env.DB.prepare(
			`UPDATE reminder_user_state SET ignored = 0
			 WHERE user_id = ? AND reminder_id = ? AND occurrence_date = ?`
		)
			.bind(user.sub, reminder.id, reminder.next_due)
			.run();

		return c.json({ success: true, ignored: false });
	}
);

// Complete a reminder (mark done, advance recurring to next occurrence)
reminders.post(
	'/:id/complete',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due, rrule FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string; rrule: string | null }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		const now = new Date().toISOString();

		// Set completed state with actioned_at timestamp
		await c.env.DB.prepare(
			`INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored, completed, actioned_at)
			 VALUES (?, ?, ?, 0, 0, 1, ?)
			 ON CONFLICT (user_id, reminder_id, occurrence_date)
			 DO UPDATE SET completed = 1, actioned_at = ?`
		)
			.bind(user.sub, reminder.id, reminder.next_due, now, now)
			.run();

		// If recurring, advance to next occurrence
		let nextDue: string | null = null;
		if (reminder.rrule) {
			nextDue = calculateNextOccurrence(reminder.rrule, reminder.next_due);
			if (nextDue) {
				await c.env.DB.prepare(
					`UPDATE reminders SET next_due = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
				)
					.bind(nextDue, reminder.id)
					.run();
			}
		}

		return c.json({ success: true, completed: true, next_due: nextDue });
	}
);

// Uncomplete a reminder (only for current occurrence)
reminders.delete(
	'/:id/complete',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const id = c.req.param('id');
		const user = c.get('user');

		// Get the reminder
		const reminder = await c.env.DB.prepare(
			`SELECT id, next_due FROM reminders
			 WHERE id = ? AND (owner_id = ? OR is_global = 1)`
		)
			.bind(id, user.sub)
			.first<{ id: number; next_due: string }>();

		if (!reminder) {
			return c.json({ error: 'Reminder not found' }, 404);
		}

		// Remove completed state
		await c.env.DB.prepare(
			`UPDATE reminder_user_state SET completed = 0, actioned_at = NULL
			 WHERE user_id = ? AND reminder_id = ? AND occurrence_date = ?`
		)
			.bind(user.sub, reminder.id, reminder.next_due)
			.run();

		return c.json({ success: true, completed: false });
	}
);

export default reminders;
