import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	linksReadMiddleware,
	linksEditMiddleware,
	linksDeleteMiddleware,
} from '../middleware/permissions';

interface Variables {
	user: AuthUser;
}

const links = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all links (optionally filtered by category)
// Only returns links owned by the authenticated user
links.get('/', authMiddleware(), linksReadMiddleware(), async (c) => {
	const user = c.get('user');
	const categoryId = c.req.query('category_id');
	const pinnedOnly = c.req.query('pinned') === 'true';

	let query = `
		SELECT l.*, c.name as category_name, c.slug as category_slug
		FROM service_links l
		LEFT JOIN categories c ON l.category_id = c.id
		WHERE l.owner_id = ?
	`;
	const params: (string | number)[] = [user.sub];

	if (categoryId) {
		query += ' AND l.category_id = ?';
		params.push(categoryId);
	}

	if (pinnedOnly) {
		query += ' AND l.is_pinned = 1';
	}

	query += ' ORDER BY l.is_pinned DESC, l.sort_order ASC, l.title ASC';

	const stmt = c.env.DB.prepare(query);
	const { results } = await stmt.bind(...params).all();

	return c.json({ links: results });
});

// Get single link (only if owned by the authenticated user)
links.get('/:id', authMiddleware(), linksReadMiddleware(), async (c) => {
	const user = c.get('user');
	const id = c.req.param('id');
	const link = await c.env.DB.prepare(
		`SELECT l.*, c.name as category_name, c.slug as category_slug
		 FROM service_links l
		 LEFT JOIN categories c ON l.category_id = c.id
		 WHERE l.id = ? AND l.owner_id = ?`
	)
		.bind(id, user.sub)
		.first();

	if (!link) {
		return c.json({ error: 'Link not found' }, 404);
	}

	return c.json({ link });
});

// Create link (requires links:edit)
// Sets owner_id to the authenticated user
links.post('/', authMiddleware(), linksEditMiddleware(), async (c) => {
	const user = c.get('user');
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
		`INSERT INTO service_links (title, description, url, icon, icon_type, category_id, is_pinned, sort_order, owner_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			body.title,
			body.description || null,
			body.url,
			body.icon || null,
			body.icon_type || 'emoji',
			body.category_id || null,
			body.is_pinned ? 1 : 0,
			body.sort_order || 0,
			user.sub
		)
		.run();

	return c.json({ success: true, id: result.meta.last_row_id }, 201);
});

// Update link (requires links:edit)
// Only updates links owned by the authenticated user
links.put('/:id', authMiddleware(), linksEditMiddleware(), async (c) => {
	const user = c.get('user');
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
		'SELECT * FROM service_links WHERE id = ? AND owner_id = ?'
	)
		.bind(id, user.sub)
		.first();

	if (!existing) {
		return c.json({ error: 'Link not found' }, 404);
	}

	await c.env.DB.prepare(
		`UPDATE service_links SET
			title = ?, description = ?, url = ?, icon = ?, icon_type = ?,
			category_id = ?, is_pinned = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND owner_id = ?`
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
			id,
			user.sub
		)
		.run();

	return c.json({ success: true });
});

// Delete link (requires links:delete)
// Only deletes links owned by the authenticated user
links.delete('/:id', authMiddleware(), linksDeleteMiddleware(), async (c) => {
	const user = c.get('user');
	const id = c.req.param('id');

	const existing = await c.env.DB.prepare(
		'SELECT id FROM service_links WHERE id = ? AND owner_id = ?'
	)
		.bind(id, user.sub)
		.first();

	if (!existing) {
		return c.json({ error: 'Link not found' }, 404);
	}

	await c.env.DB.prepare('DELETE FROM service_links WHERE id = ? AND owner_id = ?')
		.bind(id, user.sub)
		.run();

	return c.json({ success: true });
});

export default links;
