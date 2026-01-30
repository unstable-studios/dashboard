import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bell, Globe, User, FileText, Pencil, Trash2, Calendar, BellOff, X } from 'lucide-react';
import { Reminder, CalendarPermissions } from './ReminderCard';
import { formatRecurrence, formatDate, isPastDue, isUpcoming, isDueToday } from '@/lib/calendar';

interface ReminderListItemProps {
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

export function ReminderListItem({
	reminder,
	currentUserId,
	permissions,
	onEdit,
	onDelete,
	onSnooze,
	onUnsnooze,
	onIgnore,
	onUnignore,
}: ReminderListItemProps) {
	const navigate = useNavigate();
	const isOwner = reminder.owner_id === currentUserId;
	const isGlobal = reminder.is_global === 1;
	const pastDue = isPastDue(reminder.next_due);
	const upcoming = isUpcoming(reminder.next_due, reminder.advance_notice_days);
	const dueToday = isDueToday(reminder.next_due);
	const recurrence = formatRecurrence(reminder.rrule);
	const isSnoozed = reminder.snoozed === 1;
	const isIgnored = reminder.ignored === 1;
	const showActionButtons = upcoming && !pastDue;

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
					className={`flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors cursor-default ${pastDue ? 'border-destructive/50 bg-destructive/5' : upcoming ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
				>
					<Bell className={`h-5 w-5 shrink-0 ${pastDue ? 'text-destructive' : upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold truncate">{reminder.title}</h3>
							{isGlobal ? (
								<span title="Organization-wide">
									<Globe className="h-3 w-3 text-muted-foreground shrink-0" />
								</span>
							) : (
								<span title="Personal">
									<User className="h-3 w-3 text-muted-foreground shrink-0" />
								</span>
							)}
						</div>
						{reminder.description && (
							<p className="text-sm text-muted-foreground truncate">
								{reminder.description}
							</p>
						)}
					</div>
					<div className="flex items-center gap-3 shrink-0">
						{reminder.doc_title && (
							<button
								onClick={handleDocClick}
								className="flex items-center gap-1 text-xs text-primary hover:underline hidden sm:flex"
							>
								<FileText className="h-3 w-3" />
								{reminder.doc_title}
							</button>
						)}
						{recurrence && (
							<span className="text-xs bg-secondary px-2 py-0.5 rounded hidden sm:block">
								{recurrence}
							</span>
						)}
						{isSnoozed && (
							<span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded hidden sm:flex items-center gap-1">
								<BellOff className="h-3 w-3" />
								Snoozed
							</span>
						)}
						{isIgnored && (
							<span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded hidden sm:flex items-center gap-1">
								<X className="h-3 w-3" />
								Ignored
							</span>
						)}
						{showActionButtons && (
							<div className="hidden sm:flex gap-1">
								{!isSnoozed && !isIgnored && (
									<>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onSnooze?.(reminder);
											}}
											disabled={dueToday}
											title={dueToday ? "Cannot snooze reminder due today" : "Snooze until due date"}
											className="h-7 w-7 p-0"
										>
											<BellOff className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onIgnore?.(reminder);
											}}
											title="Ignore this occurrence"
											className="h-7 w-7 p-0"
										>
											<X className="h-3.5 w-3.5" />
										</Button>
									</>
								)}
								{isSnoozed && (
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											onUnsnooze?.(reminder);
										}}
										title="Unsnooze"
										className="h-7 w-7 p-0"
									>
										<Bell className="h-3.5 w-3.5" />
									</Button>
								)}
								{isIgnored && (
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											onUnignore?.(reminder);
										}}
										title="Unignore"
										className="h-7 w-7 p-0"
									>
										<Bell className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						)}
						<span className={`flex items-center gap-1 text-xs ${pastDue ? 'text-destructive font-medium' : upcoming ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
							<Calendar className="h-3 w-3" />
							{formatDate(reminder.next_due)}
							{pastDue && ' (Past due)'}
						</span>
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
