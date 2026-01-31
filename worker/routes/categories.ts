import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	categoriesReadMiddleware,
	categoriesEditMiddleware,
	categoriesDeleteMiddleware,
} from '../middleware/permissions';

interface Variables {
	user: AuthUser;
}

const categories = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all categories owned by the authenticated user
categories.get('/', authMiddleware(), categoriesReadMiddleware(), async (c) => {
	const user = c.get('user');
	const { results } = await c.env.DB.prepare(
		'SELECT * FROM categories WHERE owner_id = ? ORDER BY sort_order ASC, name ASC'
	)
		.bind(user.sub)
		.all();

	return c.json({ categories: results });
});

// Get single category (only if owned by the authenticated user)
categories.get('/:id', authMiddleware(), categoriesReadMiddleware(), async (c) => {
	const user = c.get('user');
	const id = c.req.param('id');
	const category = await c.env.DB.prepare(
		'SELECT * FROM categories WHERE id = ? AND owner_id = ?'
	)
		.bind(id, user.sub)
		.first();

	if (!category) {
		return c.json({ error: 'Category not found' }, 404);
	}

	return c.json({ category });
});

// Create category (requires categories:edit)
// Sets owner_id to the authenticated user
categories.post('/', authMiddleware(), categoriesEditMiddleware(), async (c) => {
	const user = c.get('user');
	const body = await c.req.json<{
		name: string;
		slug: string;
		icon?: string;
		color?: string;
		sort_order?: number;
	}>();

	if (!body.name || !body.slug) {
		return c.json({ error: 'Name and slug are required' }, 400);
	}

	try {
		const result = await c.env.DB.prepare(
			`INSERT INTO categories (name, slug, icon, color, sort_order, owner_id)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
			.bind(
				body.name,
				body.slug,
				body.icon || null,
				body.color || null,
				body.sort_order || 0,
				user.sub
			)
			.run();

		return c.json({ success: true, id: result.meta.last_row_id }, 201);
	} catch {
		return c.json({ error: 'Category with this slug already exists' }, 409);
	}
});

// Update category (requires categories:edit)
// Only updates categories owned by the authenticated user
categories.put('/:id', authMiddleware(), categoriesEditMiddleware(), async (c) => {
	const user = c.get('user');
	const id = c.req.param('id');
	const body = await c.req.json<{
		name?: string;
		slug?: string;
		icon?: string;
		color?: string;
		sort_order?: number;
	}>();

	const existing = await c.env.DB.prepare(
		'SELECT * FROM categories WHERE id = ? AND owner_id = ?'
	)
		.bind(id, user.sub)
		.first();

	if (!existing) {
		return c.json({ error: 'Category not found' }, 404);
	}

	await c.env.DB.prepare(
		`UPDATE categories SET
			name = ?, slug = ?, icon = ?, color = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND owner_id = ?`
	)
		.bind(
			body.name ?? existing.name,
			body.slug ?? existing.slug,
			body.icon ?? existing.icon,
			body.color ?? existing.color,
			body.sort_order ?? existing.sort_order,
			id,
			user.sub
		)
		.run();

	return c.json({ success: true });
});

// Delete category (requires categories:delete)
// Only deletes categories owned by the authenticated user
categories.delete('/:id', authMiddleware(), categoriesDeleteMiddleware(), async (c) => {
	const user = c.get('user');
	const id = c.req.param('id');

	const existing = await c.env.DB.prepare(
		'SELECT id FROM categories WHERE id = ? AND owner_id = ?'
	)
		.bind(id, user.sub)
		.first();

	if (!existing) {
		return c.json({ error: 'Category not found' }, 404);
	}

	await c.env.DB.prepare('DELETE FROM categories WHERE id = ? AND owner_id = ?')
		.bind(id, user.sub)
		.run();

	return c.json({ success: true });
});

export default categories;
