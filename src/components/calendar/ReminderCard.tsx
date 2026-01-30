import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bell, Globe, User, FileText, Pencil, Trash2, Calendar, BellOff, XCircle, CheckCircle } from 'lucide-react';
import { formatRecurrence, formatDate, isPastDue, isUpcoming, isDueToday } from '@/lib/calendar';

export interface Reminder {
	id: number;
	title: string;
	description: string | null;
	rrule: string | null;
	next_due: string;
	advance_notice_days: number;
	doc_id: number | null;
	doc_title: string | null;
	doc_slug: string | null;
	is_global: number;
	owner_id: string;
	created_at: string;
	updated_at: string;
	snoozed: number | null;
	ignored: number | null;
	completed: number | null;
	actioned_at: string | null;
}

export interface CalendarPermissions {
	canRead: boolean;
	canAddUser: boolean;
	canAddGlobal: boolean;
	canEditUser: boolean;
	canEditGlobal: boolean;
	canDeleteUser: boolean;
	canDeleteGlobal: boolean;
}

interface ReminderCardProps {
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

export function ReminderCard({
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
}: ReminderCardProps) {
	const navigate = useNavigate();
	const isOwner = reminder.owner_id === currentUserId;
	const isGlobal = reminder.is_global === 1;
	const pastDue = isPastDue(reminder.next_due);
	const upcoming = isUpcoming(reminder.next_due, reminder.advance_notice_days);
	const dueToday = isDueToday(reminder.next_due);
	const recurrence = formatRecurrence(reminder.rrule);
	const isSnoozed = reminder.snoozed === 1;
	const isIgnored = reminder.ignored === 1;
	const isCompleted = reminder.completed === 1;
	const showActionButtons = ((upcoming || pastDue) && !isHistory) || isSnoozedView;

	// Determine if user can edit/delete this reminder
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
				<div className="block cursor-default">
					<Card className={`h-full transition-colors ${isCompleted ? 'border-green-500/50 bg-green-500/5' : pastDue ? 'border-destructive/50 bg-destructive/5' : upcoming ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
						<CardHeader className="p-6 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3 min-w-0">
									<Bell className={`h-6 w-6 shrink-0 mt-0.5 ${isCompleted ? 'text-green-500' : pastDue ? 'text-destructive' : upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
									<CardTitle className="text-lg font-semibold leading-tight">
										{reminder.title}
									</CardTitle>
								</div>
								{isGlobal ? (
									<span title="Organization-wide">
										<Globe className="h-4 w-4 text-muted-foreground shrink-0" />
									</span>
								) : (
									<span title="Personal">
										<User className="h-4 w-4 text-muted-foreground shrink-0" />
									</span>
								)}
							</div>
							{reminder.description && (
								<CardDescription className="line-clamp-2 text-sm">
									{reminder.description}
								</CardDescription>
							)}
							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span className={`flex items-center gap-1 ${isCompleted ? 'text-green-600 dark:text-green-400 font-medium' : pastDue ? 'text-destructive font-medium' : upcoming ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}`}>
									<Calendar className="h-3 w-3" />
									{formatDate(reminder.next_due)}
									{pastDue && ' (Past due)'}
								</span>
								{recurrence && (
									<span className="bg-secondary px-2 py-0.5 rounded">
										{recurrence}
									</span>
								)}
								{isSnoozed && (
									<span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
										<BellOff className="h-3 w-3" />
										Snoozed
									</span>
								)}
								{isIgnored && (
									<span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
										<XCircle className="h-3 w-3" />
										Dismissed
									</span>
								)}
								{isCompleted && (
									<span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
										<CheckCircle className="h-3 w-3" />
										Completed
									</span>
								)}
								{reminder.doc_title && (
									<button
										onClick={handleDocClick}
										className="flex items-center gap-1 text-primary hover:underline"
									>
										<FileText className="h-3 w-3" />
										{reminder.doc_title}
									</button>
								)}
							</div>
							{showActionButtons && (
								<div className="flex flex-wrap gap-2 pt-2">
									{!isSnoozed && !isIgnored && !isCompleted && (
										<>
											<Button
												variant="default"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													onComplete?.(reminder);
												}}
												title="Mark as complete"
												className="gap-1"
											>
												<CheckCircle className="h-3 w-3" />
												Complete
											</Button>
											{upcoming && !dueToday && (
												<Button
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onSnooze?.(reminder);
													}}
													title="Snooze until due date"
													className="gap-1"
												>
													<BellOff className="h-3 w-3" />
													Snooze
												</Button>
											)}
											{pastDue && (
												<Button
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onIgnore?.(reminder);
													}}
													title="Dismiss this occurrence"
													className="gap-1"
												>
													<XCircle className="h-3 w-3" />
													Dismiss
												</Button>
											)}
										</>
									)}
									{isSnoozed && (
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onUnsnooze?.(reminder);
											}}
											className="gap-1"
										>
											<Bell className="h-3 w-3" />
											Unsnooze
										</Button>
									)}
									{isIgnored && (
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onUnignore?.(reminder);
											}}
											className="gap-1"
										>
											<Bell className="h-3 w-3" />
											Restore
										</Button>
									)}
									{isCompleted && (
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onUncomplete?.(reminder);
											}}
											className="gap-1"
										>
											<Bell className="h-3 w-3" />
											Restore
										</Button>
									)}
								</div>
							)}
						</CardHeader>
					</Card>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				{reminder.doc_slug && (
					<ContextMenuItem onClick={handleDocClick}>
						<FileText className="h-4 w-4 mr-2" />
						View Document
					</ContextMenuItem>
				)}
				{isHistory && (isCompleted || isIgnored) && (
					<>
						{reminder.doc_slug && <ContextMenuSeparator />}
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
				{(canEdit || canDelete) && !isHistory && (
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
