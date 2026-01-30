import { Hono } from 'hono';
import { escapeHtml } from '../lib/html-utils';

const emailActions = new Hono<{ Bindings: Env }>();

interface TokenRow {
	token: string;
	user_id: string;
	reminder_id: number;
	occurrence_date: string;
	action: string;
	expires_at: string;
	used_at: string | null;
}

// Handle one-click email actions (snooze or ignore)
// No auth required - the token is the authentication
emailActions.get('/:token', async (c) => {
	const token = c.req.param('token');

	// Look up the token
	const tokenRow = await c.env.DB.prepare(
		`SELECT * FROM email_action_tokens WHERE token = ?`
	)
		.bind(token)
		.first<TokenRow>();

	if (!tokenRow) {
		return c.html(generateErrorPage('Invalid or expired link', c.env));
	}

	// Check if already used
	if (tokenRow.used_at) {
		return c.html(
			generateErrorPage('This action has already been performed', c.env)
		);
	}

	// Check if expired
	const now = new Date();
	const expiresAt = new Date(tokenRow.expires_at);
	if (now > expiresAt) {
		return c.html(generateErrorPage('This link has expired', c.env));
	}

	// Apply the action
	if (tokenRow.action === 'snooze') {
		// Check if due today - can't snooze if due today
		const today = new Date().toISOString().split('T')[0];
		if (tokenRow.occurrence_date === today) {
			return c.html(
				generateErrorPage(
					'Cannot snooze a reminder that is due today. You can still ignore it.',
					c.env
				)
			);
		}

		await c.env.DB.prepare(
			`INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored)
			 VALUES (?, ?, ?, 1, 0)
			 ON CONFLICT (user_id, reminder_id, occurrence_date)
			 DO UPDATE SET snoozed = 1`
		)
			.bind(tokenRow.user_id, tokenRow.reminder_id, tokenRow.occurrence_date)
			.run();
	} else if (tokenRow.action === 'ignore') {
		await c.env.DB.prepare(
			`INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored)
			 VALUES (?, ?, ?, 0, 1)
			 ON CONFLICT (user_id, reminder_id, occurrence_date)
			 DO UPDATE SET ignored = 1`
		)
			.bind(tokenRow.user_id, tokenRow.reminder_id, tokenRow.occurrence_date)
			.run();
	} else {
		// Unexpected or unsupported action type
		return c.html(generateErrorPage('Invalid or unsupported action link', c.env));
	}

	// Mark token as used
	await c.env.DB.prepare(
		`UPDATE email_action_tokens SET used_at = datetime('now') WHERE token = ?`
	)
		.bind(token)
		.run();

	// Get reminder title for confirmation message
	const reminder = await c.env.DB.prepare(
		`SELECT title FROM reminders WHERE id = ?`
	)
		.bind(tokenRow.reminder_id)
		.first<{ title: string }>();

	const actionText =
		tokenRow.action === 'snooze'
			? "You've snoozed this reminder. You'll receive one final email on the due date."
			: "You've ignored this occurrence. You won't receive any more emails about it.";

	return c.html(
		generateSuccessPage(reminder?.title || 'Reminder', actionText, c.env)
	);
});

function generateSuccessPage(reminderTitle: string, message: string, env: Env): string {
	// Type-safe access to optional HUB_BASE_URL env var (URLs are NOT escaped)
	const baseUrl = (env as Env & { HUB_BASE_URL?: string }).HUB_BASE_URL || 'https://hub.unstablestudios.com';
	const escapedTitle = escapeHtml(reminderTitle);
	const escapedMessage = escapeHtml(message);

	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Complete - Echo Hub</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 500px; margin: 40px auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px;">✓</span>
      </div>
      <h1 style="color: #111827; margin: 0 0 8px 0; font-size: 20px;">${escapedTitle}</h1>
      <p style="color: #6b7280; margin: 0 0 24px 0;">${escapedMessage}</p>
      <a href="${baseUrl}/calendar" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
    </div>
  </div>
</body>
</html>
`;
}

function generateErrorPage(message: string, env: Env): string {
	// Type-safe access to optional HUB_BASE_URL env var (URLs are NOT escaped)
	const baseUrl = (env as Env & { HUB_BASE_URL?: string }).HUB_BASE_URL || 'https://hub.unstablestudios.com';
	const escapedMessage = escapeHtml(message);

	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Echo Hub</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 500px; margin: 40px auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px;">✕</span>
      </div>
      <h1 style="color: #111827; margin: 0 0 8px 0; font-size: 20px;">Action Failed</h1>
      <p style="color: #6b7280; margin: 0 0 24px 0;">${escapedMessage}</p>
      <a href="${baseUrl}/calendar" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
    </div>
  </div>
</body>
</html>
`;
}

export default emailActions;
