import { ReminderCard, Reminder, CalendarPermissions } from './ReminderCard';
import { ReminderListItem } from './ReminderListItem';
import { ViewMode } from '@/hooks/useViewPreference';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReminderGridProps {
	reminders: Reminder[];
	loading?: boolean;
	currentUserId: string;
	permissions: CalendarPermissions;
	viewMode?: ViewMode;
	onEdit?: (reminder: Reminder) => void;
	onDelete?: (reminder: Reminder) => void;
	onNewReminder?: () => void;
	canAddReminder?: boolean;
}

export function ReminderGrid({
	reminders,
	loading,
	currentUserId,
	permissions,
	viewMode = 'grid',
	onEdit,
	onDelete,
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
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
		return (
			<div className="text-center py-12 text-muted-foreground">
				<Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>No reminders found</p>
				{canAddReminder && onNewReminder && (
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
						key={reminder.id}
						reminder={reminder}
						currentUserId={currentUserId}
						permissions={permissions}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{reminders.map((reminder) => (
				<ReminderCard
					key={reminder.id}
					reminder={reminder}
					currentUserId={currentUserId}
					permissions={permissions}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
