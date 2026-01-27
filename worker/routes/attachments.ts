import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { adminMiddleware, readerMiddleware } from '../middleware/admin';

interface Variables {
	user: AuthUser;
	isAdmin: boolean;
}

interface Attachment {
	id: number;
	document_id: number;
	filename: string;
	original_name: string;
	content_type: string;
	size_bytes: number;
	r2_key: string;
	uploaded_by: string | null;
	created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'text/plain',
	'text/csv',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const attachments = new Hono<{ Bindings: Env; Variables: Variables }>();

// List attachments for a document
attachments.get('/document/:documentId', authMiddleware(), readerMiddleware(), async (c) => {
	const documentId = c.req.param('documentId');

	const { results } = await c.env.DB.prepare(
		`SELECT id, document_id, filename, original_name, content_type, size_bytes, uploaded_by, created_at
		 FROM attachments WHERE document_id = ? ORDER BY created_at DESC`
	)
		.bind(documentId)
		.all();

	return c.json({ attachments: results });
});

// Get download URL for an attachment
attachments.get('/:id/download', authMiddleware(), readerMiddleware(), async (c) => {
	const id = c.req.param('id');

	const attachment = await c.env.DB.prepare(
		'SELECT * FROM attachments WHERE id = ?'
	)
		.bind(id)
		.first<Attachment>();

	if (!attachment) {
		return c.json({ error: 'Attachment not found' }, 404);
	}

	// Get the file from R2
	const object = await c.env.ATTACHMENTS.get(attachment.r2_key);

	if (!object) {
		return c.json({ error: 'File not found in storage' }, 404);
	}

	// Return the file with appropriate headers
	const headers = new Headers();
	headers.set('Content-Type', attachment.content_type);
	// Sanitize filename for Content-Disposition (RFC 5987)
	const sanitizedName = attachment.original_name
		.replace(/[^\x20-\x7E]/g, '_') // Replace non-ASCII with underscore
		.replace(/["\\]/g, '_'); // Replace quotes and backslashes
	headers.set(
		'Content-Disposition',
		`attachment; filename="${sanitizedName}"`
	);
	headers.set('Content-Length', attachment.size_bytes.toString());

	return new Response(object.body, { headers });
});

// Upload attachment (admin only)
attachments.post(
	'/document/:documentId',
	authMiddleware(),
	adminMiddleware(),
	async (c) => {
		const user = c.get('user');
		const documentId = parseInt(c.req.param('documentId'), 10);

		if (isNaN(documentId)) {
			return c.json({ error: 'Invalid document ID' }, 400);
		}

		// Verify document exists
		const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE id = ?')
			.bind(documentId)
			.first();

		if (!doc) {
			return c.json({ error: 'Document not found' }, 404);
		}

		// Parse multipart form data
		const formData = await c.req.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return c.json({ error: 'No file provided' }, 400);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return c.json(
				{ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
				400
			);
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			return c.json(
				{ error: `File type not allowed. Allowed types: PDF, images, Office documents` },
				400
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		const extension = file.name.split('.').pop() || '';
		const filename = `${timestamp}-${randomSuffix}.${extension}`;
		const r2Key = `documents/${documentId}/${filename}`;

		// Upload to R2
		await c.env.ATTACHMENTS.put(r2Key, file.stream(), {
			httpMetadata: {
				contentType: file.type,
			},
			customMetadata: {
				originalName: file.name,
				uploadedBy: user.email,
			},
		});

		// Save metadata to database
		const result = await c.env.DB.prepare(
			`INSERT INTO attachments (document_id, filename, original_name, content_type, size_bytes, r2_key, uploaded_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				documentId,
				filename,
				file.name,
				file.type,
				file.size,
				r2Key,
				user.email
			)
			.run();

		return c.json(
			{
				success: true,
				attachment: {
					id: result.meta.last_row_id,
					document_id: documentId,
					filename,
					original_name: file.name,
					content_type: file.type,
					size_bytes: file.size,
					uploaded_by: user.email,
				},
			},
			201
		);
	}
);

// Delete attachment (admin only)
attachments.delete('/:id', authMiddleware(), adminMiddleware(), async (c) => {
	const id = c.req.param('id');

	const attachment = await c.env.DB.prepare(
		'SELECT * FROM attachments WHERE id = ?'
	)
		.bind(id)
		.first<Attachment>();

	if (!attachment) {
		return c.json({ error: 'Attachment not found' }, 404);
	}

	// Delete from R2
	await c.env.ATTACHMENTS.delete(attachment.r2_key);

	// Delete from database
	await c.env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(id).run();

	return c.json({ success: true });
});

export default attachments;
