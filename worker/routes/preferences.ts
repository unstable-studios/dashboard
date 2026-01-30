import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	prefsReadMiddleware,
	prefsEditMiddleware,
} from '../middleware/permissions';

interface Variables {
	user: AuthUser;
}

interface UserPreferences {
	theme: string;
	favorite_links: number[];
	favorite_docs: number[];
	timezone: string;
	email_notifications: boolean;
	email: string | null;
}

const preferences = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get user preferences
preferences.get('/', authMiddleware(), prefsReadMiddleware(), async (c) => {
	const user = c.get('user');

	const result = await c.env.DB.prepare(
		'SELECT theme, favorite_links, favorite_docs, timezone, email_notifications, email FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	if (!result) {
		return c.json({
			preferences: {
				theme: 'system',
				favorite_links: [],
				favorite_docs: [],
				timezone: 'America/Los_Angeles',
				email_notifications: true,
				email: user.email || null,
			},
		});
	}

	return c.json({
		preferences: {
			theme: result.theme || 'system',
			favorite_links: result.favorite_links
				? JSON.parse(result.favorite_links as string)
				: [],
			favorite_docs: result.favorite_docs
				? JSON.parse(result.favorite_docs as string)
				: [],
			timezone: result.timezone || 'America/Los_Angeles',
			email_notifications: result.email_notifications === 1,
			email: result.email || user.email || null,
		},
	});
});

// Common IANA timezones for validation
// Synced with TIMEZONES_BY_7AM_UTC in scheduled.ts
const VALID_TIMEZONES = new Set([
	'America/Los_Angeles', 'America/Vancouver', 'America/Tijuana',
	'America/Denver', 'America/Phoenix',
	'America/Chicago', 'America/Mexico_City',
	'America/New_York', 'America/Toronto', 'America/Bogota',
	'America/Halifax', 'America/Caracas',
	'America/Sao_Paulo', 'America/Buenos_Aires',
	'America/Anchorage',
	'Pacific/Honolulu',
	'Pacific/Midway', 'Pacific/Pago_Pago',
	'Pacific/Auckland', 'Pacific/Fiji',
	'Pacific/Guam',
	'Pacific/Noumea',
	'Europe/London', 'Europe/Dublin',
	'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
	'Europe/Helsinki', 'Europe/Athens',
	'Europe/Moscow',
	'Africa/Cairo', 'Africa/Lagos', 'Africa/Casablanca', 'Africa/Nairobi',
	'Asia/Dubai', 'Asia/Muscat',
	'Asia/Kuwait',
	'Asia/Karachi', 'Asia/Tashkent',
	'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Almaty',
	'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Ho_Chi_Minh',
	'Asia/Shanghai', 'Asia/Singapore', 'Asia/Hong_Kong',
	'Asia/Tokyo', 'Asia/Seoul',
	'Asia/Vladivostok',
	'Australia/Perth', 'Australia/Sydney', 'Australia/Melbourne',
	'Atlantic/South_Georgia',
	'Atlantic/Azores', 'Atlantic/Cape_Verde',
]);

// Update user preferences (requires prefs:edit)
preferences.put('/', authMiddleware(), prefsEditMiddleware(), async (c) => {
	const user = c.get('user');
	const body = await c.req.json<Partial<UserPreferences>>();

	// Validate timezone if provided
	if (body.timezone !== undefined && !VALID_TIMEZONES.has(body.timezone)) {
		return c.json({ error: 'Invalid timezone' }, 400);
	}

	// Validate email format if provided
	if (body.email !== undefined && body.email !== null && body.email !== '') {
		const emailRegex =
			/^(?!\.)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?!-)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
		if (!emailRegex.test(body.email.trim())) {
			return c.json({ error: 'Invalid email address' }, 400);
		}
	}

	// Check if user has existing preferences
	const existing = await c.env.DB.prepare(
		'SELECT user_id FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	if (existing) {
		// Update
		const updates: string[] = [];
		const values: (string | number | null)[] = [];

		if (body.theme !== undefined) {
			updates.push('theme = ?');
			values.push(body.theme);
		}
		if (body.favorite_links !== undefined) {
			updates.push('favorite_links = ?');
			values.push(JSON.stringify(body.favorite_links));
		}
		if (body.favorite_docs !== undefined) {
			updates.push('favorite_docs = ?');
			values.push(JSON.stringify(body.favorite_docs));
		}
		if (body.timezone !== undefined) {
			updates.push('timezone = ?');
			values.push(body.timezone);
		}
		if (body.email_notifications !== undefined) {
			updates.push('email_notifications = ?');
			values.push(body.email_notifications ? 1 : 0);
		}
		if (body.email !== undefined) {
			updates.push('email = ?');
			values.push(body.email);
		}

		if (updates.length > 0) {
			updates.push('updated_at = CURRENT_TIMESTAMP');
			values.push(user.sub);

			await c.env.DB.prepare(
				`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`
			)
				.bind(...values)
				.run();
		}
	} else {
		// Insert
		await c.env.DB.prepare(
			`INSERT INTO user_preferences (user_id, theme, favorite_links, favorite_docs, timezone, email_notifications, email)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				user.sub,
				body.theme || 'system',
				JSON.stringify(body.favorite_links || []),
				JSON.stringify(body.favorite_docs || []),
				body.timezone || 'America/Los_Angeles',
				body.email_notifications !== undefined ? (body.email_notifications ? 1 : 0) : 1,
				body.email || null
			)
			.run();
	}

	return c.json({ success: true });
});

// Toggle a favorite link (requires prefs:edit)
preferences.post('/toggle-favorite/:linkId', authMiddleware(), prefsEditMiddleware(), async (c) => {
	const user = c.get('user');
	const linkId = parseInt(c.req.param('linkId'), 10);

	if (isNaN(linkId)) {
		return c.json({ error: 'Invalid link ID' }, 400);
	}

	// Get current favorites
	const result = await c.env.DB.prepare(
		'SELECT favorite_links FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	const currentFavorites: number[] = result?.favorite_links
		? JSON.parse(result.favorite_links as string)
		: [];

	// Toggle
	const index = currentFavorites.indexOf(linkId);
	const favorites = index > -1
		? currentFavorites.filter((id) => id !== linkId)
		: [...currentFavorites, linkId];

	// Save
	if (result) {
		await c.env.DB.prepare(
			`UPDATE user_preferences SET favorite_links = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
		)
			.bind(JSON.stringify(favorites), user.sub)
			.run();
	} else {
		await c.env.DB.prepare(
			`INSERT INTO user_preferences (user_id, theme, favorite_links) VALUES (?, 'system', ?)`
		)
			.bind(user.sub, JSON.stringify(favorites))
			.run();
	}

	return c.json({
		success: true,
		isFavorite: index === -1,
		favorites,
	});
});

// Toggle a favorite document (requires prefs:edit)
preferences.post('/toggle-favorite-doc/:docId', authMiddleware(), prefsEditMiddleware(), async (c) => {
	const user = c.get('user');
	const docId = parseInt(c.req.param('docId'), 10);

	if (isNaN(docId)) {
		return c.json({ error: 'Invalid document ID' }, 400);
	}

	// Get current favorites
	const result = await c.env.DB.prepare(
		'SELECT favorite_docs FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	const currentFavorites: number[] = result?.favorite_docs
		? JSON.parse(result.favorite_docs as string)
		: [];

	// Toggle
	const index = currentFavorites.indexOf(docId);
	const favorites = index > -1
		? currentFavorites.filter((id) => id !== docId)
		: [...currentFavorites, docId];

	// Save
	if (result) {
		await c.env.DB.prepare(
			`UPDATE user_preferences SET favorite_docs = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
		)
			.bind(JSON.stringify(favorites), user.sub)
			.run();
	} else {
		await c.env.DB.prepare(
			`INSERT INTO user_preferences (user_id, theme, favorite_links, favorite_docs) VALUES (?, 'system', '[]', ?)`
		)
			.bind(user.sub, JSON.stringify(favorites))
			.run();
	}

	return c.json({
		success: true,
		isFavorite: index === -1,
		favorites,
	});
});

export default preferences;
