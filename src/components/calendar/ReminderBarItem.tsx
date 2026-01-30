import { useNavigate } from 'react-router';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bell, Globe, User, FileText, Pencil, Trash2, Calendar, BellOff, X } from 'lucide-react';
import { Reminder, CalendarPermissions } from './ReminderCard';
import { formatRecurrence, formatDate, isPastDue, isUpcoming } from '@/lib/calendar';

interface ReminderBarItemProps {
	reminder: Reminder;
	currentUserId: string;
	permissions: CalendarPermissions;
	onEdit?: (reminder: Reminder) => void;
	onDelete?: (reminder: Reminder) => void;
	onSnooze?: (reminder: Reminder) => void;
	onUnsnooze?: (reminder: Reminder) => void;
	onIgnore?: (reminder: Reminder) => void;
	onUnignore?: (reminder: Reminder) => void;
}

export function ReminderBarItem({
	reminder,
	currentUserId,
	permissions,
	onEdit,
	onDelete,
}: ReminderBarItemProps) {
	const navigate = useNavigate();
	const isOwner = reminder.owner_id === currentUserId;
	const isGlobal = reminder.is_global === 1;
	const pastDue = isPastDue(reminder.next_due);
	const upcoming = isUpcoming(reminder.next_due, reminder.advance_notice_days);
	const recurrence = formatRecurrence(reminder.rrule);
	const isSnoozed = reminder.snoozed === 1;
	const isIgnored = reminder.ignored === 1;

	const canEdit = isGlobal || !isOwner
		? permissions.canEditGlobal
		: permissions.canEditUser;
	const canDelete = isGlobal || !isOwner
		? permissions.canDeleteGlobal
		: permissions.canDeleteUser;

	const handleDocClick = () => {
		if (reminder.doc_slug) {
			navigate(`/docs/${reminder.doc_slug}`);
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={`flex items-center gap-2 px-3 py-2 rounded-md border bg-card hover:bg-accent transition-colors min-w-0 cursor-default ${pastDue ? 'border-destructive/50 bg-destructive/5' : upcoming ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
				>
					<Bell className={`h-4 w-4 flex-shrink-0 ${pastDue ? 'text-destructive' : upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5">
							<span className="font-medium text-sm truncate">{reminder.title}</span>
							{isGlobal ? (
								<Globe className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
							) : (
								<User className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
							)}
							{isSnoozed && (
								<BellOff className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
							)}
							{isIgnored && (
								<X className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
							)}
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className={`flex items-center gap-1 truncate ${pastDue ? 'text-destructive' : upcoming ? 'text-amber-600 dark:text-amber-400' : ''}`}>
								<Calendar className="h-3 w-3 flex-shrink-0" />
								{formatDate(reminder.next_due)}
							</span>
							{recurrence && (
								<span className="truncate">• {recurrence}</span>
							)}
						</div>
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				{reminder.doc_slug && (
					<ContextMenuItem onClick={handleDocClick}>
						<FileText className="h-4 w-4 mr-2" />
						View Document
					</ContextMenuItem>
				)}
				{(canEdit || canDelete) && (
					<>
						{reminder.doc_slug && <ContextMenuSeparator />}
						{canEdit && onEdit && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onEdit(reminder);
								}}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Edit Reminder
							</ContextMenuItem>
						)}
						{canDelete && onDelete && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onDelete(reminder);
								}}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Reminder
							</ContextMenuItem>
						)}
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
