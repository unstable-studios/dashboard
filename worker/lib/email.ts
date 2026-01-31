import { escapeHtml } from './html-utils';

interface SendEmailParams {
	to: string;
	subject: string;
	htmlBody: string;
	textBody: string;
}

export async function sendEmail(
	params: SendEmailParams,
	apiKey: string
): Promise<boolean> {
	try {
		const response = await fetch('https://api.postmarkapp.com/email', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Postmark-Server-Token': apiKey,
			},
			body: JSON.stringify({
				From: 'noreply@unstablestudios.com',
				To: params.to,
				Subject: params.subject,
				HtmlBody: params.htmlBody,
				TextBody: params.textBody,
			}),
		});

		if (!response.ok) {
			let errorBody: unknown = null;
			try {
				const contentType = response.headers.get('content-type') || '';
				if (contentType.includes('application/json')) {
					errorBody = await response.json();
				} else {
					errorBody = await response.text();
				}
			} catch {
				// Ignore body parsing errors; we'll still log status information.
			}

			console.error('Postmark email send failed', {
				status: response.status,
				statusText: response.statusText,
				body: errorBody,
			});
			return false;
		}

		return true;
	} catch (error) {
		console.error('Postmark email send encountered an error', { error });
		return false;
	}
}

interface ReminderEmailData {
	title: string;
	description: string | null;
	nextDue: string;
	docTitle: string | null;
	docUrl: string | null;
}

interface ActionUrls {
	snooze: string;
	ignore: string;
	dashboard: string;
}

export function generateReminderEmailHtml(
	reminder: ReminderEmailData,
	actionUrls: ActionUrls,
	isDueToday: boolean
): string {
	const formattedDate = new Date(reminder.nextDue + 'T00:00:00Z').toLocaleDateString(
		'en-US',
		{
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}
	);

	// Escape user-controlled content to prevent XSS
	const escapedTitle = escapeHtml(reminder.title);
	const escapedDescription = escapeHtml(reminder.description);
	const escapedDocTitle = escapeHtml(reminder.docTitle);

	// Note: URLs are NOT escaped as they need to remain valid hrefs
	const docLink = reminder.docTitle && reminder.docUrl
		? `<p style="margin: 16px 0;"><a href="${actionUrls.dashboard}${reminder.docUrl}" style="color: #3b82f6;">📄 ${escapedDocTitle}</a></p>`
		: '';

	const snoozeButton = isDueToday
		? ''
		: `<a href="${actionUrls.snooze}" style="display: inline-block; padding: 12px 24px; margin-right: 8px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">Snooze Until Due</a>`;

	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
      <h1 style="color: #111827; margin: 0 0 8px 0; font-size: 24px;">🔔 Reminder: ${escapedTitle}</h1>
      <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 14px;">Due: ${formattedDate}${isDueToday ? ' (Today!)' : ''}</p>

      ${escapedDescription ? `<p style="color: #374151; margin: 0 0 16px 0;">${escapedDescription}</p>` : ''}

      ${docLink}

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        ${snoozeButton}
        <a href="${actionUrls.ignore}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px;">Ignore This Occurrence</a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        <a href="${actionUrls.dashboard}" style="color: #6b7280;">View all reminders in Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export function generateReminderEmailText(
	reminder: ReminderEmailData,
	actionUrls: ActionUrls,
	isDueToday: boolean
): string {
	const formattedDate = new Date(reminder.nextDue + 'T00:00:00Z').toLocaleDateString(
		'en-US',
		{
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}
	);

	const lines = [
		`🔔 Reminder: ${reminder.title}`,
		`Due: ${formattedDate}${isDueToday ? ' (Today!)' : ''}`,
		'',
	];

	if (reminder.description) {
		lines.push(reminder.description, '');
	}

	if (reminder.docTitle && reminder.docUrl) {
		lines.push(`📄 Related Document: ${reminder.docTitle}`, `${actionUrls.dashboard}${reminder.docUrl}`, '');
	}

	lines.push('---', '');

	if (!isDueToday) {
		lines.push(`Snooze Until Due: ${actionUrls.snooze}`);
	}
	lines.push(`Ignore This Occurrence: ${actionUrls.ignore}`);
	lines.push('', `View all reminders: ${actionUrls.dashboard}`);

	return lines.join('\n');
}
