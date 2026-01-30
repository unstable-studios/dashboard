import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Reminder, CalendarPermissions } from '@/components/calendar/ReminderCard';
import { ReminderGrid } from '@/components/calendar/ReminderGrid';
import { ReminderDialog } from '@/components/calendar/ReminderDialog';
import { CalendarSettings } from '@/components/calendar/CalendarSettings';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authFetch } from '@/lib/auth';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useFilterPreference } from '@/hooks/useFilterPreference';
import { Plus, Bell, Settings, History, BellOff } from 'lucide-react';

interface Document {
	id: number;
	title: string;
	slug: string;
	category_name?: string | null;
	category_slug?: string | null;
}

const DEFAULT_PERMISSIONS: CalendarPermissions = {
	canRead: false,
	canAddUser: false,
	canAddGlobal: false,
	canEditUser: false,
	canEditGlobal: false,
	canDeleteUser: false,
	canDeleteGlobal: false,
};

export function CalendarPage() {
	const { getAccessTokenSilently } = useAuth0();
	const [viewMode, setViewMode] = useViewPreference('reminders');
	const [reminders, setReminders] = useState<Reminder[]>([]);
	const [historyReminders, setHistoryReminders] = useState<Reminder[]>([]);
	const [snoozedReminders, setSnoozedReminders] = useState<Reminder[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [snoozedLoading, setSnoozedLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<CalendarPermissions>(DEFAULT_PERMISSIONS);
	const [currentUserId, setCurrentUserId] = useState('');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
	const [filter, setFilter] = useFilterPreference(
		'reminders',
		'all',
		['all', 'upcoming', 'past', 'snoozed', 'history'] as const
	);

	const fetchData = async () => {
		try {
			const [remindersRes, docsRes, meRes] = await Promise.all([
				authFetch('/api/reminders', getAccessTokenSilently),
				authFetch('/api/docs', getAccessTokenSilently),
				authFetch('/api/auth/me', getAccessTokenSilently),
			]);

			if (!remindersRes.ok) {
				throw new Error('Failed to fetch reminders');
			}

			const [remindersData, docsData, meData] = await Promise.all([
				remindersRes.json(),
				docsRes.ok ? docsRes.json() : { documents: [] },
				meRes.ok ? meRes.json() : { calendar: DEFAULT_PERMISSIONS, sub: '' },
			]);

			setReminders(remindersData.reminders);
			setDocuments(docsData.documents || []);
			setPermissions(meData.calendar || DEFAULT_PERMISSIONS);
			setCurrentUserId(meData.sub || '');
		} catch (err) {
			console.error('Error fetching data:', err);
			setError(err instanceof Error ? err.message : 'Failed to load data');
		} finally {
			setLoading(false);
		}
	};

	const fetchHistory = async () => {
		setHistoryLoading(true);
		try {
			const res = await authFetch('/api/reminders/history', getAccessTokenSilently);
			if (!res.ok) {
				throw new Error('Failed to fetch history');
			}
			const data = await res.json();
			setHistoryReminders(data.reminders);
		} catch (err) {
			console.error('Error fetching history:', err);
		} finally {
			setHistoryLoading(false);
		}
	};

	const fetchSnoozed = async () => {
		setSnoozedLoading(true);
		try {
			const res = await authFetch('/api/reminders/snoozed', getAccessTokenSilently);
			if (!res.ok) {
				throw new Error('Failed to fetch snoozed');
			}
			const data = await res.json();
			setSnoozedReminders(data.reminders);
		} catch (err) {
			console.error('Error fetching snoozed:', err);
		} finally {
			setSnoozedLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [getAccessTokenSilently]);

	// Fetch history/snoozed when switching to those filters
	useEffect(() => {
		if (filter === 'history' && historyReminders.length === 0) {
			fetchHistory();
		}
		if (filter === 'snoozed' && snoozedReminders.length === 0) {
			fetchSnoozed();
		}
	}, [filter]);

	const handleEdit = (reminder: Reminder) => {
		setEditingReminder(reminder);
		setDialogOpen(true);
	};

	const handleDelete = async (reminder: Reminder) => {
		if (!confirm(`Are you sure you want to delete "${reminder.title}"?`)) return;

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete reminder');
			}

			fetchData();
		} catch (err) {
			console.error('Error deleting reminder:', err);
			alert('Failed to delete reminder');
		}
	};

	const handleNewReminder = () => {
		setEditingReminder(null);
		setDialogOpen(true);
	};

	const handleSnooze = async (reminder: Reminder) => {
		// Immediately remove from main list
		setReminders((prev) => prev.filter((r) => r.id !== reminder.id));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/snooze`, getAccessTokenSilently, {
				method: 'POST',
			});
			if (!res.ok) {
				const data = await res.json();
				// Restore on error
				setReminders((prev) => [...prev, reminder]);
				throw new Error(data.error || 'Failed to snooze reminder');
			}
			// Add to snoozed list
			const snoozedReminder = { ...reminder, snoozed: 1 };
			setSnoozedReminders((prev) => [...prev, snoozedReminder]);
		} catch (err) {
			console.error('Error snoozing reminder:', err);
			alert(err instanceof Error ? err.message : 'Failed to snooze reminder');
		}
	};

	const handleUnsnooze = async (reminder: Reminder) => {
		// Remove from snoozed list immediately
		setSnoozedReminders((prev) => prev.filter((r) => r.id !== reminder.id));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/snooze`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) {
				throw new Error('Failed to unsnooze reminder');
			}
			// Add back to main list
			const unsnoozedReminder = { ...reminder, snoozed: 0 };
			setReminders((prev) => [...prev, unsnoozedReminder]);
		} catch (err) {
			console.error('Error unsnoozing reminder:', err);
			alert('Failed to unsnooze reminder');
		}
	};

	const handleIgnore = async (reminder: Reminder) => {
		// Immediately remove from reminders UI
		setReminders((prev) => prev.filter((r) => r.id !== reminder.id));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/ignore`, getAccessTokenSilently, {
				method: 'POST',
			});
			if (!res.ok) {
				// Restore on error
				setReminders((prev) => [...prev, reminder]);
				throw new Error('Failed to dismiss reminder');
			}
			// Add to history with dismissed flag
			const dismissedReminder = { ...reminder, ignored: 1, actioned_at: new Date().toISOString() };
			setHistoryReminders((prev) => [dismissedReminder, ...prev]);
		} catch (err) {
			console.error('Error dismissing reminder:', err);
			alert('Failed to dismiss reminder');
		}
	};

	const handleUnignore = async (reminder: Reminder) => {
		// Remove from history UI immediately
		setHistoryReminders((prev) => prev.filter((r) => !(r.id === reminder.id && r.next_due === reminder.next_due)));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/ignore`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) {
				throw new Error('Failed to restore reminder');
			}
			// Refetch reminders to get the restored item
			fetchData();
		} catch (err) {
			console.error('Error restoring reminder:', err);
			alert('Failed to restore reminder');
		}
	};

	const handleComplete = async (reminder: Reminder) => {
		// Immediately remove from reminders UI
		setReminders((prev) => prev.filter((r) => r.id !== reminder.id));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/complete`, getAccessTokenSilently, {
				method: 'POST',
			});
			if (!res.ok) {
				// Restore on error
				setReminders((prev) => [...prev, reminder]);
				throw new Error('Failed to complete reminder');
			}
			// Add to history with completed flag
			const completedReminder = { ...reminder, completed: 1, actioned_at: new Date().toISOString() };
			setHistoryReminders((prev) => [completedReminder, ...prev]);
			// If recurring, refetch to get next occurrence
			if (reminder.rrule) {
				fetchData();
			}
		} catch (err) {
			console.error('Error completing reminder:', err);
			alert('Failed to complete reminder');
		}
	};

	const handleUncomplete = async (reminder: Reminder) => {
		// Remove from history UI immediately
		setHistoryReminders((prev) => prev.filter((r) => !(r.id === reminder.id && r.next_due === reminder.next_due)));

		try {
			const res = await authFetch(`/api/reminders/${reminder.id}/complete`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) {
				throw new Error('Failed to restore reminder');
			}
			// Refetch reminders to get the restored item
			fetchData();
		} catch (err) {
			console.error('Error restoring reminder:', err);
			alert('Failed to restore reminder');
		}
	};

	// Filter reminders
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const filteredReminders = (() => {
		if (filter === 'history') return historyReminders;
		if (filter === 'snoozed') return snoozedReminders;
		return reminders.filter((reminder) => {
			const dueDate = new Date(reminder.next_due + 'T00:00:00');
			if (filter === 'upcoming') {
				return dueDate >= today;
			}
			if (filter === 'past') {
				return dueDate < today;
			}
			return true;
		});
	})();

	// Sort: past due first (most overdue first), then upcoming (soonest first)
	// For history, sort by actioned_at descending
	const sortedReminders = [...filteredReminders].sort((a, b) => {
		if (filter === 'history') {
			const dateA = a.actioned_at ? new Date(a.actioned_at) : new Date(0);
			const dateB = b.actioned_at ? new Date(b.actioned_at) : new Date(0);
			return dateB.getTime() - dateA.getTime();
		}
		const dateA = new Date(a.next_due + 'T00:00:00');
		const dateB = new Date(b.next_due + 'T00:00:00');
		return dateA.getTime() - dateB.getTime();
	});

	const canAddReminder = permissions.canAddUser || permissions.canAddGlobal;
	const isHistoryView = filter === 'history';
	const isSnoozedView = filter === 'snoozed';
	const currentLoading = filter === 'history' ? historyLoading : filter === 'snoozed' ? snoozedLoading : loading;

	return (
		<AppShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Calendar</h1>
						<p className="text-muted-foreground">
							Reminders for recurring business tasks
						</p>
					</div>
					<div className="flex items-center gap-3">
						<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
						{canAddReminder && (
							<Button onClick={handleNewReminder} className="gap-2">
								<Plus className="h-4 w-4" />
								New Reminder
							</Button>
						)}
					</div>
				</div>

				<Tabs defaultValue="reminders">
					<TabsList>
						<TabsTrigger value="reminders" className="gap-2">
							<Bell className="h-4 w-4" />
							Reminders
						</TabsTrigger>
						<TabsTrigger value="settings" className="gap-2">
							<Settings className="h-4 w-4" />
							Settings
						</TabsTrigger>
					</TabsList>

					<TabsContent value="reminders" className="space-y-4 mt-4">
						{/* Filter buttons */}
						<div className="flex flex-wrap gap-2">
							<Button
								variant={filter === 'all' ? 'secondary' : 'outline'}
								size="sm"
								onClick={() => setFilter('all')}
							>
								All
							</Button>
							<Button
								variant={filter === 'upcoming' ? 'secondary' : 'outline'}
								size="sm"
								onClick={() => setFilter('upcoming')}
							>
								Upcoming
							</Button>
							<Button
								variant={filter === 'past' ? 'secondary' : 'outline'}
								size="sm"
								onClick={() => setFilter('past')}
							>
								Past Due
							</Button>
							<Button
								variant={filter === 'snoozed' ? 'secondary' : 'outline'}
								size="sm"
								onClick={() => setFilter('snoozed')}
								className="gap-1"
							>
								<BellOff className="h-3 w-3" />
								Snoozed
							</Button>
							<Button
								variant={filter === 'history' ? 'secondary' : 'outline'}
								size="sm"
								onClick={() => setFilter('history')}
								className="gap-1"
							>
								<History className="h-3 w-3" />
								History
							</Button>
						</div>

						{error ? (
							<div className="text-destructive">{error}</div>
						) : (
							<ReminderGrid
								reminders={sortedReminders}
								loading={currentLoading}
								currentUserId={currentUserId}
								permissions={permissions}
								viewMode={viewMode}
								isHistory={isHistoryView}
								isSnoozed={isSnoozedView}
								onEdit={handleEdit}
								onDelete={handleDelete}
								onSnooze={handleSnooze}
								onUnsnooze={handleUnsnooze}
								onIgnore={handleIgnore}
								onUnignore={handleUnignore}
								onComplete={handleComplete}
								onUncomplete={handleUncomplete}
								onNewReminder={handleNewReminder}
								canAddReminder={canAddReminder}
							/>
						)}
					</TabsContent>

					<TabsContent value="settings" className="mt-4">
						<CalendarSettings />
					</TabsContent>
				</Tabs>

				<ReminderDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					reminder={editingReminder}
					documents={documents}
					permissions={permissions}
					currentUserId={currentUserId}
					onSaved={fetchData}
				/>
			</div>
		</AppShell>
	);
}
