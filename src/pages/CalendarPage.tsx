import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ReminderCard, Reminder, CalendarPermissions } from '@/components/calendar/ReminderCard';
import { ReminderDialog } from '@/components/calendar/ReminderDialog';
import { CalendarSettings } from '@/components/calendar/CalendarSettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authFetch } from '@/lib/auth';
import { Plus, Bell, Settings } from 'lucide-react';

interface Document {
	id: number;
	title: string;
	slug: string;
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
	const [reminders, setReminders] = useState<Reminder[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<CalendarPermissions>(DEFAULT_PERMISSIONS);
	const [currentUserId, setCurrentUserId] = useState('');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
	const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

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

	useEffect(() => {
		fetchData();
	}, [getAccessTokenSilently]);

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

	// Filter reminders
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const filteredReminders = reminders.filter((reminder) => {
		const dueDate = new Date(reminder.next_due + 'T00:00:00');
		if (filter === 'upcoming') {
			return dueDate >= today;
		}
		if (filter === 'past') {
			return dueDate < today;
		}
		return true;
	});

	// Sort: past due first (most overdue first), then upcoming (soonest first)
	const sortedReminders = [...filteredReminders].sort((a, b) => {
		const dateA = new Date(a.next_due + 'T00:00:00');
		const dateB = new Date(b.next_due + 'T00:00:00');
		return dateA.getTime() - dateB.getTime();
	});

	const canAddReminder = permissions.canAddUser || permissions.canAddGlobal;

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
					{canAddReminder && (
						<Button onClick={handleNewReminder} className="gap-2">
							<Plus className="h-4 w-4" />
							New Reminder
						</Button>
					)}
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
						</div>

						{error ? (
							<div className="text-destructive">{error}</div>
						) : loading ? (
							<div className="text-muted-foreground">Loading reminders...</div>
						) : sortedReminders.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>No reminders found</p>
								{canAddReminder && (
									<Button
										variant="outline"
										className="mt-4"
										onClick={handleNewReminder}
									>
										Create your first reminder
									</Button>
								)}
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{sortedReminders.map((reminder) => (
									<ReminderCard
										key={reminder.id}
										reminder={reminder}
										currentUserId={currentUserId}
										permissions={permissions}
										onEdit={handleEdit}
										onDelete={handleDelete}
									/>
								))}
							</div>
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
