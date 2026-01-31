import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { calendarReadMiddleware } from '../middleware/calendar';

interface Variables {
	user: AuthUser;
}

const calendar = new Hono<{ Bindings: Env; Variables: Variables }>();

// Generate a random token
function generateToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
		''
	);
}

// Get or create calendar token
calendar.get(
	'/token',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const user = c.get('user');

		// Check if token exists
		let tokenRow = await c.env.DB.prepare(
			'SELECT token FROM calendar_tokens WHERE user_id = ?'
		)
			.bind(user.sub)
			.first<{ token: string }>();

		if (!tokenRow) {
			// Create new token
			const token = generateToken();
			await c.env.DB.prepare(
				'INSERT INTO calendar_tokens (user_id, token) VALUES (?, ?)'
			)
				.bind(user.sub, token)
				.run();
			tokenRow = { token };
		}

		// Build the full subscription URL
		const host = c.req.header('host') || 'hub.unstablestudios.com';
		const protocol = host.includes('localhost') ? 'http' : 'https';
		const subscriptionUrl = `${protocol}://${host}/calendar.ics?token=${tokenRow.token}`;

		return c.json({
			token: tokenRow.token,
			subscriptionUrl,
		});
	}
);

// Regenerate calendar token
calendar.post(
	'/token/regenerate',
	authMiddleware(),
	calendarReadMiddleware(),
	async (c) => {
		const user = c.get('user');
		const token = generateToken();

		// Upsert token
		await c.env.DB.prepare(
			`INSERT INTO calendar_tokens (user_id, token, created_at)
			 VALUES (?, ?, CURRENT_TIMESTAMP)
			 ON CONFLICT(user_id) DO UPDATE SET token = ?, created_at = CURRENT_TIMESTAMP`
		)
			.bind(user.sub, token, token)
			.run();

		const host = c.req.header('host') || 'hub.unstablestudios.com';
		const protocol = host.includes('localhost') ? 'http' : 'https';
		const subscriptionUrl = `${protocol}://${host}/calendar.ics?token=${token}`;

		return c.json({
			token,
			subscriptionUrl,
		});
	}
);

// Format date for iCal (YYYYMMDD for all-day events)
function formatICalDate(dateStr: string): string {
	return dateStr.replace(/-/g, '');
}

// Format datetime for iCal DTSTAMP (YYYYMMDDTHHmmssZ)
function formatICalDateTime(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escape text for iCal format
function escapeICalText(text: string | null): string {
	if (!text) return '';
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

// Fold long lines for iCal (max 75 chars per line)
function foldLine(line: string): string {
	const maxLength = 75;
	if (line.length <= maxLength) return line;

	const result: string[] = [];
	let remaining = line;

	while (remaining.length > 0) {
		if (result.length === 0) {
			result.push(remaining.slice(0, maxLength));
			remaining = remaining.slice(maxLength);
		} else {
			// Continuation lines start with space
			result.push(' ' + remaining.slice(0, maxLength - 1));
			remaining = remaining.slice(maxLength - 1);
		}
	}

	return result.join('\r\n');
}

// iCal feed endpoint (token-authenticated, no Bearer auth)
calendar.get('/feed', async (c) => {
	const token = c.req.query('token');

	if (!token) {
		return c.text('Missing token', 401);
	}

	// Validate token and get user_id
	const tokenRow = await c.env.DB.prepare(
		'SELECT user_id FROM calendar_tokens WHERE token = ?'
	)
		.bind(token)
		.first<{ user_id: string }>();

	if (!tokenRow) {
		return c.text('Invalid token', 401);
	}

	// Get user's reminders + global reminders
	const { results: reminders } = await c.env.DB.prepare(
		`SELECT r.*, d.title as doc_title, d.slug as doc_slug
		 FROM reminders r
		 LEFT JOIN documents d ON r.doc_id = d.id
		 WHERE r.owner_id = ? OR r.is_global = 1
		 ORDER BY r.next_due ASC`
	)
		.bind(tokenRow.user_id)
		.all<{
			id: number;
			title: string;
			description: string | null;
			rrule: string | null;
			next_due: string;
			advance_notice_days: number;
			doc_id: number | null;
			doc_title: string | null;
			doc_slug: string | null;
			is_global: number;
			owner_id: string;
			updated_at: string;
		}>();

	const host = c.req.header('host') || 'hub.unstablestudios.com';
	const protocol = host.includes('localhost') ? 'http' : 'https';
	const baseUrl = `${protocol}://${host}`;

	// Build iCal content (RFC 5545 compliant)
	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Echo Hub//Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:Echo Hub Reminders',
		'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
		'X-PUBLISHED-TTL:PT1H',
	];

	// Current timestamp for DTSTAMP fallback
	const nowStamp = formatICalDateTime(new Date().toISOString());

	for (const reminder of reminders) {
		const uid = `reminder-${reminder.id}@hub.unstablestudios.com`;
		const dtstart = formatICalDate(reminder.next_due);

		// Calculate DTEND (next day for all-day events)
		const startDate = new Date(reminder.next_due + 'T00:00:00Z');
		startDate.setUTCDate(startDate.getUTCDate() + 1);
		const dtend = startDate.toISOString().slice(0, 10).replace(/-/g, '');

		// Build description
		let description = escapeICalText(reminder.description);
		if (reminder.doc_slug) {
			const docUrl = `${baseUrl}/docs/${reminder.doc_slug}`;
			if (description) {
				description += '\\n\\n';
			}
			description += `Document: ${docUrl}`;
		}

		// Use updated_at if available, otherwise current time
		const dtstamp = reminder.updated_at
			? formatICalDateTime(reminder.updated_at)
			: nowStamp;

		lines.push('BEGIN:VEVENT');
		lines.push(foldLine(`UID:${uid}`));
		lines.push(`DTSTAMP:${dtstamp}`);
		lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
		lines.push(`DTEND;VALUE=DATE:${dtend}`);
		lines.push(foldLine(`SUMMARY:${escapeICalText(reminder.title)}`));

		if (description) {
			lines.push(foldLine(`DESCRIPTION:${description}`));
		}

		if (reminder.rrule) {
			lines.push(foldLine(`RRULE:${reminder.rrule}`));
		}

		// Add alarm for advance notice
		if (reminder.advance_notice_days > 0) {
			lines.push('BEGIN:VALARM');
			lines.push(`TRIGGER:-P${reminder.advance_notice_days}D`);
			lines.push('ACTION:DISPLAY');
			lines.push(
				foldLine(`DESCRIPTION:Reminder: ${escapeICalText(reminder.title)}`)
			);
			lines.push('END:VALARM');
		}

		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');

	// Join with CRLF and ensure file ends with CRLF (RFC 5545 requirement)
	const icalContent = lines.join('\r\n') + '\r\n';

	return new Response(icalContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			// No Content-Disposition header - allows calendar apps to subscribe instead of download
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
});

export default calendar;
