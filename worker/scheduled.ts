import {
	sendEmail,
	generateReminderEmailHtml,
	generateReminderEmailText,
} from './lib/email';

// Timezone map: UTC hour -> list of timezones where it's 7am local
// For example: when it's 15:00 UTC, it's 7am in Pacific Time (UTC-8)
//
// IMPORTANT: This mapping assumes fixed offsets and does NOT account for
// Daylight Saving Time (DST). For example, America/Los_Angeles is UTC-8
// during PST (winter) but UTC-7 during PDT (summer). This will cause
// emails to be sent at the wrong hour during DST transitions.
//
// Consider using a proper timezone library or dynamically calculating
// the UTC hour for each timezone based on the current date.
const TIMEZONES_BY_7AM_UTC: Record<number, string[]> = {
	// 7am local = what UTC hour?
	// UTC+0 (London): 7am local = 07:00 UTC
	7: ['Europe/London', 'Europe/Dublin', 'Africa/Casablanca'],
	// UTC+1 (Paris): 7am local = 06:00 UTC
	6: ['Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Africa/Lagos'],
	// UTC+2 (Helsinki): 7am local = 05:00 UTC
	5: ['Europe/Helsinki', 'Africa/Cairo', 'Europe/Athens'],
	// UTC+3 (Moscow): 7am local = 04:00 UTC
	4: ['Europe/Moscow', 'Asia/Kuwait', 'Africa/Nairobi'],
	// UTC+4 (Dubai): 7am local = 03:00 UTC
	3: ['Asia/Dubai', 'Asia/Muscat'],
	// UTC+5 (Karachi): 7am local = 02:00 UTC
	2: ['Asia/Karachi', 'Asia/Tashkent'],
	// UTC+5:30 (India): 7am local = 01:30 UTC - handled by closest hour
	// UTC+6 (Dhaka): 7am local = 01:00 UTC
	1: ['Asia/Dhaka', 'Asia/Almaty', 'Asia/Kolkata'],
	// UTC+7 (Bangkok): 7am local = 00:00 UTC
	0: ['Asia/Bangkok', 'Asia/Jakarta', 'Asia/Ho_Chi_Minh'],
	// UTC+8 (Shanghai): 7am local = 23:00 UTC (previous day)
	23: ['Asia/Shanghai', 'Asia/Singapore', 'Asia/Hong_Kong', 'Australia/Perth'],
	// UTC+9 (Tokyo): 7am local = 22:00 UTC
	22: ['Asia/Tokyo', 'Asia/Seoul'],
	// UTC+10 (Sydney): 7am local = 21:00 UTC
	21: ['Australia/Sydney', 'Australia/Melbourne', 'Pacific/Guam'],
	// UTC+11 (Vladivostok): 7am local = 20:00 UTC
	20: ['Pacific/Noumea', 'Asia/Vladivostok'],
	// UTC+12 (Auckland): 7am local = 19:00 UTC
	19: ['Pacific/Auckland', 'Pacific/Fiji'],
	// UTC-12 (Baker Island): 7am local = 19:00 UTC
	// UTC-11: 7am local = 18:00 UTC
	18: ['Pacific/Midway', 'Pacific/Pago_Pago'],
	// UTC-10 (Hawaii): 7am local = 17:00 UTC
	17: ['Pacific/Honolulu'],
	// UTC-9 (Alaska): 7am local = 16:00 UTC
	16: ['America/Anchorage'],
	// UTC-8 (PST): 7am local = 15:00 UTC
	15: ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'],
	// UTC-7 (MST): 7am local = 14:00 UTC
	14: ['America/Denver', 'America/Phoenix'],
	// UTC-6 (CST): 7am local = 13:00 UTC
	13: ['America/Chicago', 'America/Mexico_City'],
	// UTC-5 (EST): 7am local = 12:00 UTC
	12: ['America/New_York', 'America/Toronto', 'America/Bogota'],
	// UTC-4 (AST): 7am local = 11:00 UTC
	11: ['America/Halifax', 'America/Caracas'],
	// UTC-3 (BRT): 7am local = 10:00 UTC
	10: ['America/Sao_Paulo', 'America/Buenos_Aires'],
	// UTC-2: 7am local = 09:00 UTC
	9: ['Atlantic/South_Georgia'],
	// UTC-1: 7am local = 08:00 UTC
	8: ['Atlantic/Azores', 'Atlantic/Cape_Verde'],
};

function generateToken(): string {
	// Prefer the built-in UUID v4 generator when available
	if ('randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	// Fallback: generate a UUID v4 from 16 random bytes
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// Per RFC 4122, set the version to 4 (random) and variant to 10xxxxxx
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

	return (
		hex.slice(0, 8) +
		'-' +
		hex.slice(8, 12) +
		'-' +
		hex.slice(12, 16) +
		'-' +
		hex.slice(16, 20) +
		'-' +
		hex.slice(20)
	);
}

function getToday(): string {
	return new Date().toISOString().split('T')[0];
}

interface ReminderRow {
	id: number;
	title: string;
	description: string | null;
	next_due: string;
	advance_notice_days: number;
	doc_title: string | null;
	doc_slug: string | null;
	is_global: number;
	owner_id: string;
}

interface UserPrefRow {
	user_id: string;
	email: string;
	timezone: string;
}

interface UserStateRow {
	snoozed: number;
	ignored: number;
}

export async function handleScheduled(
	_event: ScheduledEvent,
	env: Env
): Promise<void> {
	if (!env.POSTMARK_API_KEY) {
		console.error(
			'POSTMARK_API_KEY is not configured; skipping scheduled email processing.'
		);
		return;
	}

	const now = new Date();
	const currentUtcHour = now.getUTCHours();
	const today = getToday();

	// Find which timezones should receive emails now (it's 7am there)
	const targetTimezones = TIMEZONES_BY_7AM_UTC[currentUtcHour] || [];

	if (targetTimezones.length === 0) {
		console.log(`No timezones have 7am at UTC hour ${currentUtcHour}`);
		return;
	}

	console.log(
		`Processing email reminders for timezones: ${targetTimezones.join(', ')}`
	);

	// Build timezone placeholder for SQL IN clause
	const tzPlaceholders = targetTimezones.map(() => '?').join(',');

	// Find users with email notifications enabled in these timezones
	const { results: users } = await env.DB.prepare(
		`SELECT user_id, email, timezone FROM user_preferences
		 WHERE email_notifications = 1
		 AND email IS NOT NULL
		 AND timezone IN (${tzPlaceholders})`
	)
		.bind(...targetTimezones)
		.all<UserPrefRow>();

	if (!users || users.length === 0) {
		console.log('No users with email notifications enabled in target timezones');
		return;
	}

	console.log(`Found ${users.length} users to process`);

	// Type-safe access to optional HUB_BASE_URL env var
	const baseUrl =
		(env as Env & { HUB_BASE_URL?: string }).HUB_BASE_URL || 'https://hub.unstablestudios.com';

	for (const user of users) {
		try {
			await processUserReminders(env, user, today, baseUrl);
		} catch (err) {
			console.error(`Error processing user ${user.user_id}:`, err);
		}
	}
}

async function processUserReminders(
	env: Env,
	user: UserPrefRow,
	today: string,
	baseUrl: string
): Promise<void> {
	// Get all reminders visible to this user (their own + global)
	const { results: reminders } = await env.DB.prepare(
		`SELECT r.id, r.title, r.description, r.next_due, r.advance_notice_days,
				r.is_global, r.owner_id, d.title as doc_title, d.slug as doc_slug
		 FROM reminders r
		 LEFT JOIN documents d ON r.doc_id = d.id
		 WHERE r.owner_id = ? OR r.is_global = 1`
	)
		.bind(user.user_id)
		.all<ReminderRow>();

	if (!reminders || reminders.length === 0) {
		return;
	}

	const todayDate = new Date(today + 'T00:00:00Z');

	for (const reminder of reminders) {
		try {
			await processReminder(env, user, reminder, today, todayDate, baseUrl);
		} catch (err) {
			console.error(
				`Error processing reminder ${reminder.id} for user ${user.user_id}:`,
				err
			);
		}
	}
}

async function processReminder(
	env: Env,
	user: UserPrefRow,
	reminder: ReminderRow,
	today: string,
	todayDate: Date,
	baseUrl: string
): Promise<void> {
	const dueDate = new Date(reminder.next_due + 'T00:00:00Z');
	const advanceDate = new Date(dueDate);
	advanceDate.setDate(advanceDate.getDate() - reminder.advance_notice_days);

	// Check if we're in the advance notice window
	const isInWindow = todayDate >= advanceDate && todayDate <= dueDate;
	const isPastDue = todayDate > dueDate;
	const isDueToday = reminder.next_due === today;

	// Skip if not in window or past due
	if (!isInWindow || isPastDue) {
		return;
	}

	// Check user state for this reminder occurrence
	const userState = await env.DB.prepare(
		`SELECT snoozed, ignored FROM reminder_user_state
		 WHERE user_id = ? AND reminder_id = ? AND occurrence_date = ?`
	)
		.bind(user.user_id, reminder.id, reminder.next_due)
		.first<UserStateRow>();

	// Skip if ignored
	if (userState?.ignored) {
		return;
	}

	// Skip if snoozed (unless it's due today - final reminder)
	if (userState?.snoozed && !isDueToday) {
		return;
	}

	// Check if we already sent an email for this reminder occurrence
	const existingLog = await env.DB.prepare(
		`SELECT id FROM reminder_email_log
		 WHERE user_id = ? AND reminder_id = ? AND occurrence_date = ?`
	)
		.bind(user.user_id, reminder.id, reminder.next_due)
		.first();

	if (existingLog) {
		return; // Already sent for this occurrence
	}

	// Generate action tokens
	const snoozeToken = generateToken();
	const ignoreToken = generateToken();
	const expiresAt = new Date(dueDate);
	expiresAt.setDate(expiresAt.getDate() + 7); // Tokens valid for 7 days after due date

	// Insert tokens
	const batchResults = await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO email_action_tokens (token, user_id, reminder_id, occurrence_date, action, expires_at)
			 VALUES (?, ?, ?, ?, 'snooze', ?)`
		).bind(
			snoozeToken,
			user.user_id,
			reminder.id,
			reminder.next_due,
			expiresAt.toISOString()
		),
		env.DB.prepare(
			`INSERT INTO email_action_tokens (token, user_id, reminder_id, occurrence_date, action, expires_at)
			 VALUES (?, ?, ?, ?, 'ignore', ?)`
		).bind(
			ignoreToken,
			user.user_id,
			reminder.id,
			reminder.next_due,
			expiresAt.toISOString()
		),
	]);

	// Check if token inserts succeeded
	if (batchResults.some((r) => !r.success)) {
		console.error(
			`Failed to insert action tokens for user ${user.user_id}, reminder ${reminder.id}`
		);
		return;
	}

	// Build email content
	const reminderData = {
		title: reminder.title,
		description: reminder.description,
		nextDue: reminder.next_due,
		docTitle: reminder.doc_title,
		docUrl: reminder.doc_slug ? `/docs/${reminder.doc_slug}` : null,
	};

	const actionUrls = {
		snooze: `${baseUrl}/api/email-action/${snoozeToken}`,
		ignore: `${baseUrl}/api/email-action/${ignoreToken}`,
		dashboard: baseUrl,
	};

	const htmlBody = generateReminderEmailHtml(reminderData, actionUrls, isDueToday);
	const textBody = generateReminderEmailText(reminderData, actionUrls, isDueToday);

	// Send email
	const success = await sendEmail(
		{
			to: user.email,
			subject: `🔔 Reminder: ${reminder.title}${isDueToday ? ' (Due Today!)' : ''}`,
			htmlBody,
			textBody,
		},
		env.POSTMARK_API_KEY
	);

	if (success) {
		// Log the sent email
		await env.DB.prepare(
			`INSERT INTO reminder_email_log (user_id, reminder_id, occurrence_date)
			 VALUES (?, ?, ?)`
		)
			.bind(user.user_id, reminder.id, reminder.next_due)
			.run();

		console.log(
			`Sent reminder email to ${user.email} for reminder ${reminder.id}`
		);
	} else {
		console.error(
			`Failed to send reminder email to ${user.email} for reminder ${reminder.id}`
		);
	}
}
