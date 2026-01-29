import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bell, Globe, User, FileText, Pencil, Trash2, Calendar } from 'lucide-react';
import { formatRecurrence, formatDate, isPastDue, isUpcoming } from '@/lib/calendar';

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
	onEdit?: (reminder: Reminder) => void;
	onDelete?: (reminder: Reminder) => void;
}

export function ReminderCard({
	reminder,
	currentUserId,
	permissions,
	onEdit,
	onDelete,
}: ReminderCardProps) {
	const navigate = useNavigate();
	const isOwner = reminder.owner_id === currentUserId;
	const isGlobal = reminder.is_global === 1;
	const pastDue = isPastDue(reminder.next_due);
	const upcoming = isUpcoming(reminder.next_due, reminder.advance_notice_days);
	const recurrence = formatRecurrence(reminder.rrule);

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
					<Card className={`h-full transition-colors ${pastDue ? 'border-destructive/50 bg-destructive/5' : upcoming ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
						<CardHeader className="p-6 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<Bell className={`h-6 w-6 shrink-0 ${pastDue ? 'text-destructive' : upcoming ? 'text-amber-500' : 'text-muted-foreground'}`} />
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
								<span className={`flex items-center gap-1 ${pastDue ? 'text-destructive font-medium' : upcoming ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}`}>
									<Calendar className="h-3 w-3" />
									{formatDate(reminder.next_due)}
									{pastDue && ' (Past due)'}
								</span>
								{recurrence && (
									<span className="bg-secondary px-2 py-0.5 rounded">
										{recurrence}
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
