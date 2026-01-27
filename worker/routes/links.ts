import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

interface Variables {
	user: AuthUser;
	isAdmin: boolean;
}

const links = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all links (optionally filtered by category)
links.get('/', authMiddleware(), async (c) => {
	const categoryId = c.req.query('category_id');
	const pinnedOnly = c.req.query('pinned') === 'true';

	let query = `
		SELECT l.*, c.name as category_name, c.slug as category_slug
		FROM service_links l
		LEFT JOIN categories c ON l.category_id = c.id
		WHERE 1=1
	`;
	const params: (string | number)[] = [];

	if (categoryId) {
		query += ' AND l.category_id = ?';
		params.push(categoryId);
	}

	if (pinnedOnly) {
		query += ' AND l.is_pinned = 1';
	}

	query += ' ORDER BY l.is_pinned DESC, l.sort_order ASC, l.title ASC';

	const stmt = c.env.DB.prepare(query);
	const { results } = params.length > 0
		? await stmt.bind(...params).all()
		: await stmt.all();

	return c.json({ links: results });
});

// Get single link
links.get('/:id', authMiddleware(), async (c) => {
	const id = c.req.param('id');
	const link = await c.env.DB.prepare(
		`SELECT l.*, c.name as category_name, c.slug as category_slug
		 FROM service_links l
		 LEFT JOIN categories c ON l.category_id = c.id
		 WHERE l.id = ?`
	)
		.bind(id)
		.first();

	if (!link) {
		return c.json({ error: 'Link not found' }, 404);
	}

	return c.json({ link });
});

// Create link (admin only)
links.post('/', authMiddleware(), adminMiddleware(), async (c) => {
	const body = await c.req.json<{
		title: string;
		url: string;
		description?: string;
		icon?: string;
		icon_type?: string;
		category_id?: number;
		is_pinned?: boolean;
		sort_order?: number;
	}>();

	if (!body.title || !body.url) {
		return c.json({ error: 'Title and URL are required' }, 400);
	}

	const result = await c.env.DB.prepare(
		`INSERT INTO service_links (title, description, url, icon, icon_type, category_id, is_pinned, sort_order)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			body.title,
			body.description || null,
			body.url,
			body.icon || null,
			body.icon_type || 'emoji',
			body.category_id || null,
			body.is_pinned ? 1 : 0,
			body.sort_order || 0
		)
		.run();

	return c.json({ success: true, id: result.meta.last_row_id }, 201);
});

// Update link (admin only)
links.put('/:id', authMiddleware(), adminMiddleware(), async (c) => {
	const id = c.req.param('id');
	const body = await c.req.json<{
		title?: string;
		url?: string;
		description?: string;
		icon?: string;
		icon_type?: string;
		category_id?: number | null;
		is_pinned?: boolean;
		sort_order?: number;
	}>();

	const existing = await c.env.DB.prepare(
		'SELECT * FROM service_links WHERE id = ?'
	)
		.bind(id)
		.first();

	if (!existing) {
		return c.json({ error: 'Link not found' }, 404);
	}

	await c.env.DB.prepare(
		`UPDATE service_links SET
			title = ?, description = ?, url = ?, icon = ?, icon_type = ?,
			category_id = ?, is_pinned = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`
	)
		.bind(
			body.title ?? existing.title,
			body.description ?? existing.description,
			body.url ?? existing.url,
			body.icon ?? existing.icon,
			body.icon_type ?? existing.icon_type,
			body.category_id !== undefined ? body.category_id : existing.category_id,
			body.is_pinned !== undefined ? (body.is_pinned ? 1 : 0) : existing.is_pinned,
			body.sort_order ?? existing.sort_order,
			id
		)
		.run();

	return c.json({ success: true });
});

// Delete link (admin only)
links.delete('/:id', authMiddleware(), adminMiddleware(), async (c) => {
	const id = c.req.param('id');

	await c.env.DB.prepare('DELETE FROM service_links WHERE id = ?')
		.bind(id)
		.run();

	return c.json({ success: true });
});

export default links;
