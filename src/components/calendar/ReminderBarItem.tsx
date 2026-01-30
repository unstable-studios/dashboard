import { useNavigate } from 'react-router';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MarqueeText } from '@/components/ui/marquee-text';
import { Bell, Globe, User, FileText, Pencil, Trash2, Calendar, BellOff, XCircle, CheckCircle } from 'lucide-react';
import { Reminder, CalendarPermissions } from './ReminderCard';
import { formatRecurrence, formatDate, isPastDue, isUpcoming, isDueToday } from '@/lib/calendar';
import { useFeatures } from '@/hooks/useFeatures';

interface ReminderBarItemProps {
	reminder: Reminder;
	currentUserId: string;
	permissions: CalendarPermissions;
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
}

export function ReminderBarItem({
	reminder,
	currentUserId,
	permissions,
	isHistory,
	isSnoozed: isSnoozedView,
	onEdit,
	onDelete,
	onSnooze,
	onUnsnooze,
	onIgnore,
	onUnignore,
	onComplete,
	onUncomplete,
}: ReminderBarItemProps) {
	const navigate = useNavigate();
	const { orgs: orgsEnabled } = useFeatures();
	const isOwner = reminder.owner_id === currentUserId;
	const isGlobal = reminder.is_global === 1;
	const pastDue = isPastDue(reminder.next_due);
	const upcoming = isUpcoming(reminder.next_due, reminder.advance_notice_days);
	const recurrence = formatRecurrence(reminder.rrule);
	const isSnoozed = reminder.snoozed === 1;
	const isIgnored = reminder.ignored === 1;
	const isCompleted = reminder.completed === 1;
	const showActions = ((upcoming || pastDue) && !isHistory) || isSnoozedView;

	const canEdit = isGlobal || !isOwner
		? permissions.canEditGlobal
		: permissions.canEditUser;
	const canDelete = isGlobal || !isOwner
		? permissions.canDeleteGlobal
		: permissions.canDeleteUser;

	const handleClick = () => {
		navigate('/calendar');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			navigate('/calendar');
		}
	};

	const handleDocClick = () => {
		if (reminder.doc_slug) {
			navigate(`/docs/${reminder.doc_slug}`);
		}
	};

	// Build className based on state
	const baseClasses = 'group flex items-center gap-2 px-3 py-2 h-14 rounded-md border bg-card transition-colors min-w-0 cursor-pointer';
	const stateClasses = isCompleted
		? 'border-green-500/50 bg-green-500/5 hover:bg-green-500/10'
		: pastDue
		? 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10'
		: upcoming
		? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10'
		: 'hover:bg-accent';

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					role="button"
					tabIndex={0}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					className={`${baseClasses} ${stateClasses}`}
				>
					<Bell className={`h-4 w-4 flex-shrink-0 ${isCompleted ? 'text-green-500' : pastDue ? 'text-destructive' : upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<MarqueeText className="font-medium text-sm flex-1 min-w-0">
								{reminder.title}
							</MarqueeText>
							{orgsEnabled && (
								isGlobal ? (
									<Globe className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
								) : (
									<User className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
								)
							)}
							{isSnoozed && (
								<BellOff className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
							)}
							{isIgnored && (
								<XCircle className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
							)}
							{isCompleted && (
								<CheckCircle className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />
							)}
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className={`flex items-center gap-1 truncate ${isCompleted ? 'text-green-600 dark:text-green-400' : pastDue ? 'text-destructive' : upcoming ? 'text-amber-600 dark:text-amber-400' : ''}`}>
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
				<ContextMenuItem onClick={handleClick}>
					<Calendar className="h-4 w-4 mr-2" />
					View in Calendar
				</ContextMenuItem>
				{reminder.doc_slug && (
					<ContextMenuItem onClick={handleDocClick}>
						<FileText className="h-4 w-4 mr-2" />
						View Document
					</ContextMenuItem>
				)}
				{showActions && !isSnoozed && !isIgnored && !isCompleted && (
					<>
						<ContextMenuSeparator />
						{onComplete && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onComplete(reminder);
								}}
							>
								<CheckCircle className="h-4 w-4 mr-2" />
								Complete
							</ContextMenuItem>
						)}
						{onSnooze && upcoming && !isDueToday(reminder.next_due) && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onSnooze(reminder);
								}}
							>
								<BellOff className="h-4 w-4 mr-2" />
								Snooze
							</ContextMenuItem>
						)}
						{onIgnore && pastDue && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onIgnore(reminder);
								}}
							>
								<XCircle className="h-4 w-4 mr-2" />
								Dismiss
							</ContextMenuItem>
						)}
					</>
				)}
				{showActions && isSnoozed && onUnsnooze && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onUnsnooze(reminder);
							}}
						>
							<Bell className="h-4 w-4 mr-2" />
							Unsnooze
						</ContextMenuItem>
					</>
				)}
				{showActions && isIgnored && onUnignore && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onUnignore(reminder);
							}}
						>
							<Bell className="h-4 w-4 mr-2" />
							Restore
						</ContextMenuItem>
					</>
				)}
				{showActions && isCompleted && onUncomplete && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onUncomplete(reminder);
							}}
						>
							<Bell className="h-4 w-4 mr-2" />
							Restore
						</ContextMenuItem>
					</>
				)}
				{isHistory && (isCompleted || isIgnored) && (
					<>
						<ContextMenuSeparator />
						{isCompleted && onUncomplete && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onUncomplete(reminder);
								}}
							>
								<Bell className="h-4 w-4 mr-2" />
								Restore
							</ContextMenuItem>
						)}
						{isIgnored && onUnignore && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onUnignore(reminder);
								}}
							>
								<Bell className="h-4 w-4 mr-2" />
								Restore
							</ContextMenuItem>
						)}
					</>
				)}
				{((canEdit && onEdit) || (canDelete && onDelete)) && !isHistory && (
					<>
						<ContextMenuSeparator />
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
