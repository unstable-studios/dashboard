import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch } from '@/lib/auth';
import { Reminder, CalendarPermissions } from './ReminderCard';

interface Document {
	id: number;
	title: string;
	slug: string;
}

// Recurrence presets that generate RRULE strings
const RECURRENCE_PRESETS = [
	{ label: 'None (one-time)', value: '' },
	{ label: 'Weekly', value: 'FREQ=WEEKLY' },
	{ label: 'Monthly', value: 'FREQ=MONTHLY' },
	{ label: 'Quarterly', value: 'FREQ=MONTHLY;INTERVAL=3' },
	{ label: 'Yearly', value: 'FREQ=YEARLY' },
];

interface ReminderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reminder?: Reminder | null;
	documents: Document[];
	permissions: CalendarPermissions;
	currentUserId: string;
	onSaved: () => void;
}

export function ReminderDialog({
	open,
	onOpenChange,
	reminder,
	documents,
	permissions,
	currentUserId,
	onSaved,
}: ReminderDialogProps) {
	const { getAccessTokenSilently } = useAuth0();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [nextDue, setNextDue] = useState('');
	const [rrule, setRrule] = useState('');
	const [advanceNoticeDays, setAdvanceNoticeDays] = useState(7);
	const [docId, setDocId] = useState<number | ''>('');
	const [isGlobal, setIsGlobal] = useState(false);

	const isEditing = !!reminder;

	// Determine permissions for this reminder
	const isOwner = reminder?.owner_id === currentUserId;
	const reminderIsGlobal = reminder?.is_global === 1;

	const canEdit = isEditing
		? reminderIsGlobal || !isOwner
			? permissions.canEditGlobal
			: permissions.canEditUser
		: true;

	const canDelete = isEditing
		? reminderIsGlobal || !isOwner
			? permissions.canDeleteGlobal
			: permissions.canDeleteUser
		: false;

	const canMakeGlobal = permissions.canAddGlobal;

	useEffect(() => {
		if (reminder) {
			setTitle(reminder.title);
			setDescription(reminder.description || '');
			setNextDue(reminder.next_due);
			setRrule(reminder.rrule || '');
			setAdvanceNoticeDays(reminder.advance_notice_days);
			setDocId(reminder.doc_id || '');
			setIsGlobal(reminder.is_global === 1);
		} else {
			setTitle('');
			setDescription('');
			// Default to today's date
			setNextDue(new Date().toISOString().split('T')[0]);
			setRrule('');
			setAdvanceNoticeDays(7);
			setDocId('');
			setIsGlobal(false);
		}
		setError(null);
	}, [reminder, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const body = {
				title,
				description: description || null,
				next_due: nextDue,
				rrule: rrule || null,
				advance_notice_days: advanceNoticeDays,
				doc_id: docId || null,
				is_global: isGlobal,
			};

			const res = await authFetch(
				isEditing ? `/api/reminders/${reminder.id}` : '/api/reminders',
				getAccessTokenSilently,
				{
					method: isEditing ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save reminder');
			}

			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save reminder');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!reminder || !confirm('Are you sure you want to delete this reminder?')) return;

		setSaving(true);
		try {
			const res = await authFetch(`/api/reminders/${reminder.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete reminder');
			}

			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete reminder');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
					<DialogDescription>
						{isEditing ? 'Update the reminder details.' : 'Create a new reminder for recurring tasks.'}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g., Quarterly tax filing"
							required
							disabled={!canEdit}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Additional details"
							disabled={!canEdit}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="nextDue">Due Date</Label>
							<Input
								id="nextDue"
								type="date"
								value={nextDue}
								onChange={(e) => setNextDue(e.target.value)}
								required
								disabled={!canEdit}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="advanceNotice">Advance Notice (days)</Label>
							<Input
								id="advanceNotice"
								type="number"
								min="0"
								max="365"
								value={advanceNoticeDays}
								onChange={(e) => setAdvanceNoticeDays(Number(e.target.value))}
								disabled={!canEdit}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="recurrence">Recurrence</Label>
							<select
								id="recurrence"
								value={rrule}
								onChange={(e) => setRrule(e.target.value)}
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
								disabled={!canEdit}
							>
								{RECURRENCE_PRESETS.map((preset) => (
									<option key={preset.value} value={preset.value}>
										{preset.label}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="document">Linked Document</Label>
							<select
								id="document"
								value={docId}
								onChange={(e) =>
									setDocId(e.target.value ? Number(e.target.value) : '')
								}
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
								disabled={!canEdit}
							>
								<option value="">No document</option>
								{documents.map((doc) => (
									<option key={doc.id} value={doc.id}>
										{doc.title}
									</option>
								))}
							</select>
						</div>
					</div>

					{canMakeGlobal && (
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="global"
								checked={isGlobal}
								onChange={(e) => setIsGlobal(e.target.checked)}
								className="rounded border-input"
								disabled={!canEdit}
							/>
							<Label htmlFor="global" className="font-normal">
								Organization-wide (visible to all users)
							</Label>
						</div>
					)}

					<div className="flex justify-between pt-4">
						<div>
							{isEditing && canDelete && (
								<Button
									type="button"
									variant="outline"
									onClick={handleDelete}
									disabled={saving}
									className="text-destructive hover:text-destructive"
								>
									Delete
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							{canEdit && (
								<Button type="submit" disabled={saving}>
									{saving ? 'Saving...' : isEditing ? 'Save' : 'Add Reminder'}
								</Button>
							)}
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
