export function formatRecurrence(rrule: string | null): string | null {
	if (!rrule) return null;

	if (rrule.includes('FREQ=WEEKLY')) return 'Weekly';
	if (rrule.includes('FREQ=MONTHLY') && rrule.includes('INTERVAL=3')) return 'Quarterly';
	if (rrule.includes('FREQ=MONTHLY')) return 'Monthly';
	if (rrule.includes('FREQ=YEARLY')) return 'Yearly';
	if (rrule.includes('FREQ=DAILY')) return 'Daily';

	return 'Recurring';
}

export function formatDate(dateStr: string): string {
	const date = new Date(dateStr + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export function isPastDue(dateStr: string): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dueDate = new Date(dateStr + 'T00:00:00');
	return dueDate < today;
}

export function isUpcoming(dateStr: string, advanceDays: number): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dueDate = new Date(dateStr + 'T00:00:00');
	const advanceDate = new Date(dueDate);
	advanceDate.setDate(advanceDate.getDate() - advanceDays);
	return today >= advanceDate && today <= dueDate;
}

export function isUpcomingOrPastDue(dateStr: string, advanceDays: number): boolean {
	return isPastDue(dateStr) || isUpcoming(dateStr, advanceDays);
}
