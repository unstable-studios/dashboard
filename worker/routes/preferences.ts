import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';

interface Variables {
	user: AuthUser;
}

interface UserPreferences {
	theme: string;
	favorite_links: number[];
	favorite_docs: number[];
}

const preferences = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get user preferences
preferences.get('/', authMiddleware(), async (c) => {
	const user = c.get('user');

	const result = await c.env.DB.prepare(
		'SELECT theme, favorite_links, favorite_docs FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	if (!result) {
		return c.json({
			preferences: {
				theme: 'system',
				favorite_links: [],
				favorite_docs: [],
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
		},
	});
});

// Update user preferences
preferences.put('/', authMiddleware(), async (c) => {
	const user = c.get('user');
	const body = await c.req.json<Partial<UserPreferences>>();

	// Check if user has existing preferences
	const existing = await c.env.DB.prepare(
		'SELECT user_id FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	if (existing) {
		// Update
		const updates: string[] = [];
		const values: (string | null)[] = [];

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
			`INSERT INTO user_preferences (user_id, theme, favorite_links, favorite_docs)
			 VALUES (?, ?, ?, ?)`
		)
			.bind(
				user.sub,
				body.theme || 'system',
				JSON.stringify(body.favorite_links || []),
				JSON.stringify(body.favorite_docs || [])
			)
			.run();
	}

	return c.json({ success: true });
});

// Toggle a favorite link
preferences.post('/toggle-favorite/:linkId', authMiddleware(), async (c) => {
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

// Toggle a favorite document
preferences.post('/toggle-favorite-doc/:docId', authMiddleware(), async (c) => {
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
