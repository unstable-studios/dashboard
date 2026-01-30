import { ReminderCard, Reminder, CalendarPermissions } from './ReminderCard';
import { ReminderListItem } from './ReminderListItem';
import { ReminderBarItem } from './ReminderBarItem';
import { ViewMode } from '@/hooks/useViewPreference';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReminderGridProps {
	reminders: Reminder[];
	loading?: boolean;
	currentUserId: string;
	permissions: CalendarPermissions;
	viewMode?: ViewMode;
	isHistory?: boolean;
	isSnoozed?: boolean;
	onEdit?: (reminder: Reminder) => void;
	onDelete?: (reminder: Reminder) => void;
	onSnooze?: (reminder: Reminder) => void;
	onUnsnooze?: (reminder: Reminder) => void;
	onIgnore?: (reminder: Reminder) => void;
	onUnignore?: (reminder: Reminder) => void;
	onComplete?: (reminder: Reminder) => void;
	onUncomplete?: (reminder: Reminder) => void;
	onNewReminder?: () => void;
	canAddReminder?: boolean;
}

export function ReminderGrid({
	reminders,
	loading,
	currentUserId,
	permissions,
	viewMode = 'grid',
	isHistory,
	isSnoozed,
	onEdit,
	onDelete,
	onSnooze,
	onUnsnooze,
	onIgnore,
	onUnignore,
	onComplete,
	onUncomplete,
	onNewReminder,
	canAddReminder,
}: ReminderGridProps) {
	if (loading) {
		if (viewMode === 'list') {
			return (
				<div className="space-y-2">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-16 rounded-lg bg-muted animate-pulse"
						/>
					))}
				</div>
			);
		}
		if (viewMode === 'bar') {
			return (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
					{[...Array(12)].map((_, i) => (
						<div
							key={i}
							className="h-14 rounded-md bg-muted animate-pulse"
						/>
					))}
				</div>
			);
		}
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="h-32 rounded-lg bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (reminders.length === 0) {
		const emptyMessage = isHistory
			? 'No history items found'
			: isSnoozed
				? 'No snoozed reminders'
				: 'No reminders found';
		return (
			<div className="text-center py-12 text-muted-foreground">
				<Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>{emptyMessage}</p>
				{canAddReminder && onNewReminder && !isHistory && !isSnoozed && (
					<Button
						variant="outline"
						className="mt-4"
						onClick={onNewReminder}
					>
						Create your first reminder
					</Button>
				)}
			</div>
		);
	}

	if (viewMode === 'list') {
		return (
			<div className="space-y-2">
				{reminders.map((reminder) => (
					<ReminderListItem
						key={isHistory || isSnoozed ? `${reminder.id}-${reminder.next_due}` : reminder.id}
						reminder={reminder}
						currentUserId={currentUserId}
						permissions={permissions}
						isHistory={isHistory}
						isSnoozed={isSnoozed}
						onEdit={onEdit}
						onDelete={onDelete}
						onSnooze={onSnooze}
						onUnsnooze={onUnsnooze}
						onIgnore={onIgnore}
						onUnignore={onUnignore}
						onComplete={onComplete}
						onUncomplete={onUncomplete}
					/>
				))}
			</div>
		);
	}

	if (viewMode === 'bar') {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
				{reminders.map((reminder) => (
					<ReminderBarItem
						key={isHistory || isSnoozed ? `${reminder.id}-${reminder.next_due}` : reminder.id}
						reminder={reminder}
						currentUserId={currentUserId}
						permissions={permissions}
						isHistory={isHistory}
						isSnoozed={isSnoozed}
						onEdit={onEdit}
						onDelete={onDelete}
						onSnooze={onSnooze}
						onUnsnooze={onUnsnooze}
						onIgnore={onIgnore}
						onUnignore={onUnignore}
						onComplete={onComplete}
						onUncomplete={onUncomplete}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{reminders.map((reminder) => (
				<ReminderCard
					key={isHistory || isSnoozed ? `${reminder.id}-${reminder.next_due}` : reminder.id}
					reminder={reminder}
					currentUserId={currentUserId}
					permissions={permissions}
					isHistory={isHistory}
					isSnoozed={isSnoozed}
					onEdit={onEdit}
					onDelete={onDelete}
					onSnooze={onSnooze}
					onUnsnooze={onUnsnooze}
					onIgnore={onIgnore}
					onUnignore={onUnignore}
					onComplete={onComplete}
					onUncomplete={onUncomplete}
				/>
			))}
		</div>
	);
}
