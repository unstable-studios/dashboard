import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import {
	docsReadMiddleware,
	docsEditMiddleware,
	docsDeleteMiddleware,
} from '../middleware/permissions';

interface Variables {
	user: AuthUser;
}

const docs = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all documents owned by the authenticated user (optionally filtered by category)
docs.get('/', authMiddleware(), docsReadMiddleware(), async (c) => {
	const categoryId = c.req.query('category_id');
	const user = c.get('user');

	let query = `
		SELECT d.*, c.name as category_name, c.slug as category_slug
		FROM documents d
		LEFT JOIN categories c ON d.category_id = c.id
		WHERE d.owner_id = ?
	`;
	const params: (string | number)[] = [user.sub];

	if (categoryId) {
		query += ' AND d.category_id = ?';
		params.push(categoryId);
	}

	query += ' ORDER BY d.updated_at DESC';

	const stmt = c.env.DB.prepare(query);
	const { results } = await stmt.bind(...params).all();

	return c.json({ documents: results });
});

// Get single document by slug (only if owned by the authenticated user)
docs.get('/:slug', authMiddleware(), docsReadMiddleware(), async (c) => {
	const slug = c.req.param('slug');
	const user = c.get('user');

	const doc = await c.env.DB.prepare(
		`SELECT d.*, c.name as category_name, c.slug as category_slug
		 FROM documents d
		 LEFT JOIN categories c ON d.category_id = c.id
		 WHERE d.slug = ? AND d.owner_id = ?`
	)
		.bind(slug, user.sub)
		.first();

	if (!doc) {
		return c.json({ error: 'Document not found' }, 404);
	}

	return c.json({ document: doc });
});

// Create document (requires docs:edit)
// Sets owner_id to the authenticated user
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
			`INSERT INTO documents (title, slug, content, excerpt, category_id, external_url, external_type, is_published, created_by, updated_by, owner_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
				user.email,
				user.sub
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
// Only updates documents owned by the authenticated user
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
		'SELECT * FROM documents WHERE slug = ? AND owner_id = ?'
	)
		.bind(slug, user.sub)
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
		// Snapshot current version before updating
		const maxVersion = await c.env.DB.prepare(
			'SELECT COALESCE(MAX(version_number), 0) as max_version FROM document_versions WHERE document_id = ?'
		)
			.bind(existing.id)
			.first<{ max_version: number }>();

		const nextVersion = (maxVersion?.max_version || 0) + 1;

		await c.env.DB.prepare(
			`INSERT INTO document_versions (document_id, version_number, title, content, excerpt, created_by)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
			.bind(
				existing.id,
				nextVersion,
				existing.title,
				existing.content,
				existing.excerpt,
				user.email
			)
			.run();

		// Now update the document
		await c.env.DB.prepare(
			`UPDATE documents SET
				title = ?, slug = ?, content = ?, excerpt = ?,
				category_id = ?, external_url = ?, external_type = ?,
				is_published = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
			 WHERE slug = ? AND owner_id = ?`
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
				slug,
				user.sub
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

// List document versions (only for documents owned by the authenticated user)
docs.get('/:slug/versions', authMiddleware(), docsReadMiddleware(), async (c) => {
	const slug = c.req.param('slug');
	const user = c.get('user');

	const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE slug = ? AND owner_id = ?')
		.bind(slug, user.sub)
		.first<{ id: number }>();

	if (!doc) {
		return c.json({ error: 'Document not found' }, 404);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT version_number, title, created_by, created_at
		 FROM document_versions
		 WHERE document_id = ?
		 ORDER BY version_number DESC`
	)
		.bind(doc.id)
		.all();

	return c.json({ versions: results });
});

// Get specific document version (only for documents owned by the authenticated user)
docs.get('/:slug/versions/:versionNumber', authMiddleware(), docsReadMiddleware(), async (c) => {
	const slug = c.req.param('slug');
	const versionNumber = parseInt(c.req.param('versionNumber'), 10);
	const user = c.get('user');

	if (isNaN(versionNumber)) {
		return c.json({ error: 'Invalid version number' }, 400);
	}

	const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE slug = ? AND owner_id = ?')
		.bind(slug, user.sub)
		.first<{ id: number }>();

	if (!doc) {
		return c.json({ error: 'Document not found' }, 404);
	}

	const version = await c.env.DB.prepare(
		`SELECT version_number, title, content, excerpt, created_by, created_at
		 FROM document_versions
		 WHERE document_id = ? AND version_number = ?`
	)
		.bind(doc.id, versionNumber)
		.first();

	if (!version) {
		return c.json({ error: 'Version not found' }, 404);
	}

	return c.json({ version });
});

// Delete document (requires docs:delete)
// Only deletes documents owned by the authenticated user
docs.delete('/:slug', authMiddleware(), docsDeleteMiddleware(), async (c) => {
	const slug = c.req.param('slug');
	const user = c.get('user');

	const existing = await c.env.DB.prepare(
		'SELECT id FROM documents WHERE slug = ? AND owner_id = ?'
	)
		.bind(slug, user.sub)
		.first();

	if (!existing) {
		return c.json({ error: 'Document not found' }, 404);
	}

	await c.env.DB.prepare('DELETE FROM documents WHERE slug = ? AND owner_id = ?')
		.bind(slug, user.sub)
		.run();

	return c.json({ success: true });
});

export default docs;
