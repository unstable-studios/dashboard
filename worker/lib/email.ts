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
	return response.ok;
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
	const formattedDate = new Date(reminder.nextDue + 'T00:00:00').toLocaleDateString(
		'en-US',
		{
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}
	);

	const docLink = reminder.docTitle && reminder.docUrl
		? `<p style="margin: 16px 0;"><a href="${actionUrls.dashboard}${reminder.docUrl}" style="color: #3b82f6;">📄 ${reminder.docTitle}</a></p>`
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
      <h1 style="color: #111827; margin: 0 0 8px 0; font-size: 24px;">🔔 Reminder: ${reminder.title}</h1>
      <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 14px;">Due: ${formattedDate}${isDueToday ? ' (Today!)' : ''}</p>

      ${reminder.description ? `<p style="color: #374151; margin: 0 0 16px 0;">${reminder.description}</p>` : ''}

      ${docLink}

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        ${snoozeButton}
        <a href="${actionUrls.ignore}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px;">Ignore This Occurrence</a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        <a href="${actionUrls.dashboard}" style="color: #6b7280;">View all reminders in Echo Hub</a>
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
	const formattedDate = new Date(reminder.nextDue + 'T00:00:00').toLocaleDateString(
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
