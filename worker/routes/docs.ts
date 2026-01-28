import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	docsReadMiddleware,
	docsEditMiddleware,
	docsDeleteMiddleware,
	canReadUnpublishedDocs,
} from '../middleware/permissions';

interface Variables {
	user: AuthUser;
}

const docs = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all published documents (optionally filtered by category)
docs.get('/', authMiddleware(), docsReadMiddleware(), async (c) => {
	const categoryId = c.req.query('category_id');
	const includeUnpublished = c.req.query('include_unpublished') === 'true';
	const user = c.get('user');
	const hasUnpublishedAccess = canReadUnpublishedDocs(user.permissions);

	let query = `
		SELECT d.*, c.name as category_name, c.slug as category_slug
		FROM documents d
		LEFT JOIN categories c ON d.category_id = c.id
		WHERE 1=1
	`;
	const params: (string | number)[] = [];

	// Only users with unpublished access can see unpublished documents
	if (!includeUnpublished || !hasUnpublishedAccess) {
		query += ' AND d.is_published = 1';
	}

	if (categoryId) {
		query += ' AND d.category_id = ?';
		params.push(categoryId);
	}

	query += ' ORDER BY d.updated_at DESC';

	const stmt = c.env.DB.prepare(query);
	const { results } = params.length > 0
		? await stmt.bind(...params).all()
		: await stmt.all();

	return c.json({ documents: results });
});

// Get single document by slug
docs.get('/:slug', authMiddleware(), docsReadMiddleware(), async (c) => {
	const slug = c.req.param('slug');

	const doc = await c.env.DB.prepare(
		`SELECT d.*, c.name as category_name, c.slug as category_slug
		 FROM documents d
		 LEFT JOIN categories c ON d.category_id = c.id
		 WHERE d.slug = ?`
	)
		.bind(slug)
		.first();

	if (!doc) {
		return c.json({ error: 'Document not found' }, 404);
	}

	// Only show unpublished docs to users with unpublished access
	if (!doc.is_published) {
		const user = c.get('user');
		if (!canReadUnpublishedDocs(user.permissions)) {
			return c.json({ error: 'Document not found' }, 404);
		}
	}

	return c.json({ document: doc });
});

// Create document (requires docs:edit)
docs.post('/', authMiddleware(), docsEditMiddleware(), async (c) => {
	const user = c.get('user');
	const body = await c.req.json<{
		title: string;
		slug: string;
		content?: string;
		excerpt?: string;
		category_id?: number;
		external_url?: string;
		external_type?: string;
		is_published?: boolean;
	}>();

	if (!body.title || !body.slug) {
		return c.json({ error: 'Title and slug are required' }, 400);
	}

	// Validate slug format (lowercase, alphanumeric, hyphens)
	if (!/^[a-z0-9-]+$/.test(body.slug)) {
		return c.json(
			{ error: 'Slug must be lowercase alphanumeric with hyphens only' },
			400
		);
	}

	try {
		const result = await c.env.DB.prepare(
			`INSERT INTO documents (title, slug, content, excerpt, category_id, external_url, external_type, is_published, created_by, updated_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				body.title,
				body.slug,
				body.content || null,
				body.excerpt || null,
				body.category_id || null,
				body.external_url || null,
				body.external_type || null,
				body.is_published !== false ? 1 : 0,
				user.email,
				user.email
			)
			.run();

		return c.json({ success: true, id: result.meta.last_row_id }, 201);
	} catch (error) {
		// Check for unique constraint violation on slug
		if (error instanceof Error && error.message.includes('UNIQUE')) {
			return c.json({ error: 'A document with this slug already exists' }, 409);
		}
		throw error;
	}
});

// Update document (requires docs:edit)
docs.put('/:slug', authMiddleware(), docsEditMiddleware(), async (c) => {
	const slug = c.req.param('slug');
	const user = c.get('user');
	const body = await c.req.json<{
		title?: string;
		slug?: string;
		content?: string;
		excerpt?: string;
		category_id?: number | null;
		external_url?: string | null;
		external_type?: string | null;
		is_published?: boolean;
	}>();

	const existing = await c.env.DB.prepare(
		'SELECT * FROM documents WHERE slug = ?'
	)
		.bind(slug)
		.first();

	if (!existing) {
		return c.json({ error: 'Document not found' }, 404);
	}

	// Validate new slug if changing
	if (body.slug && body.slug !== slug && !/^[a-z0-9-]+$/.test(body.slug)) {
		return c.json(
			{ error: 'Slug must be lowercase alphanumeric with hyphens only' },
			400
		);
	}

	try {
		await c.env.DB.prepare(
			`UPDATE documents SET
				title = ?, slug = ?, content = ?, excerpt = ?,
				category_id = ?, external_url = ?, external_type = ?,
				is_published = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
			 WHERE slug = ?`
		)
			.bind(
				body.title ?? existing.title,
				body.slug ?? slug,
				body.content !== undefined ? body.content : existing.content,
				body.excerpt !== undefined ? body.excerpt : existing.excerpt,
				body.category_id !== undefined
					? body.category_id
					: existing.category_id,
				body.external_url !== undefined
					? body.external_url
					: existing.external_url,
				body.external_type !== undefined
					? body.external_type
					: existing.external_type,
				body.is_published !== undefined
					? body.is_published
						? 1
						: 0
					: existing.is_published,
				user.email,
				slug
			)
			.run();

		return c.json({ success: true, slug: body.slug ?? slug });
	} catch (error) {
		if (error instanceof Error && error.message.includes('UNIQUE')) {
			return c.json({ error: 'A document with this slug already exists' }, 409);
		}
		throw error;
	}
});

// Delete document (requires docs:delete)
docs.delete('/:slug', authMiddleware(), docsDeleteMiddleware(), async (c) => {
	const slug = c.req.param('slug');

	const result = await c.env.DB.prepare('DELETE FROM documents WHERE slug = ?')
		.bind(slug)
		.run();

	if (result.meta.changes === 0) {
		return c.json({ error: 'Document not found' }, 404);
	}

	return c.json({ success: true });
});

export default docs;
