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

// List all categories (requires categories:read)
categories.get('/', authMiddleware(), categoriesReadMiddleware(), async (c) => {
	const { results } = await c.env.DB.prepare(
		'SELECT * FROM categories ORDER BY sort_order ASC, name ASC'
	).all();

	return c.json({ categories: results });
});

// Get single category
categories.get('/:id', authMiddleware(), categoriesReadMiddleware(), async (c) => {
	const id = c.req.param('id');
	const category = await c.env.DB.prepare(
		'SELECT * FROM categories WHERE id = ?'
	)
		.bind(id)
		.first();

	if (!category) {
		return c.json({ error: 'Category not found' }, 404);
	}

	return c.json({ category });
});

// Create category (requires categories:edit)
categories.post('/', authMiddleware(), categoriesEditMiddleware(), async (c) => {
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
			`INSERT INTO categories (name, slug, icon, color, sort_order)
			 VALUES (?, ?, ?, ?, ?)`
		)
			.bind(
				body.name,
				body.slug,
				body.icon || null,
				body.color || null,
				body.sort_order || 0
			)
			.run();

		return c.json({ success: true, id: result.meta.last_row_id }, 201);
	} catch {
		return c.json({ error: 'Category with this slug already exists' }, 409);
	}
});

// Update category (requires categories:edit)
categories.put('/:id', authMiddleware(), categoriesEditMiddleware(), async (c) => {
	const id = c.req.param('id');
	const body = await c.req.json<{
		name?: string;
		slug?: string;
		icon?: string;
		color?: string;
		sort_order?: number;
	}>();

	const existing = await c.env.DB.prepare(
		'SELECT * FROM categories WHERE id = ?'
	)
		.bind(id)
		.first();

	if (!existing) {
		return c.json({ error: 'Category not found' }, 404);
	}

	await c.env.DB.prepare(
		`UPDATE categories SET
			name = ?, slug = ?, icon = ?, color = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`
	)
		.bind(
			body.name ?? existing.name,
			body.slug ?? existing.slug,
			body.icon ?? existing.icon,
			body.color ?? existing.color,
			body.sort_order ?? existing.sort_order,
			id
		)
		.run();

	return c.json({ success: true });
});

// Delete category (requires categories:delete)
categories.delete('/:id', authMiddleware(), categoriesDeleteMiddleware(), async (c) => {
	const id = c.req.param('id');

	await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

	return c.json({ success: true });
});

export default categories;
