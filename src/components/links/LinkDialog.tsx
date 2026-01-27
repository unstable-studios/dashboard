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
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { authFetch } from '@/lib/auth';
import { ServiceLink } from './LinkCard';

interface Category {
	id: number;
	name: string;
	slug: string;
}

interface LinkDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	link?: ServiceLink | null;
	categories: Category[];
	onSaved: () => void;
}

export function LinkDialog({
	open,
	onOpenChange,
	link,
	categories,
	onSaved,
}: LinkDialogProps) {
	const { getAccessTokenSilently } = useAuth0();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [description, setDescription] = useState('');
	const [icon, setIcon] = useState('');
	const [categoryId, setCategoryId] = useState<number | ''>('');
	const [isPinned, setIsPinned] = useState(false);

	const isEditing = !!link;

	useEffect(() => {
		if (link) {
			setTitle(link.title);
			setUrl(link.url);
			setDescription(link.description || '');
			setIcon(link.icon || '');
			setCategoryId(link.category_id || '');
			setIsPinned(!!link.is_pinned);
		} else {
			setTitle('');
			setUrl('');
			setDescription('');
			setIcon('');
			setCategoryId('');
			setIsPinned(false);
		}
		setError(null);
	}, [link, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const body = {
				title,
				url,
				description: description || null,
				icon: icon || null,
				icon_type: 'emoji',
				category_id: categoryId || null,
				is_pinned: isPinned,
			};

			const res = await authFetch(
				isEditing ? `/api/links/${link.id}` : '/api/links',
				getAccessTokenSilently,
				{
					method: isEditing ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save link');
			}

			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save link');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!link || !confirm('Are you sure you want to delete this link?')) return;

		setSaving(true);
		try {
			const res = await authFetch(`/api/links/${link.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete link');
			}

			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete link');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit Link' : 'Add Link'}</DialogTitle>
					<DialogDescription>
						{isEditing ? 'Update the service link details.' : 'Add a new service link.'}
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
							placeholder="Service name"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="url">URL</Label>
						<Input
							id="url"
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://..."
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Icon</Label>
							<EmojiPicker value={icon} onChange={setIcon} />
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<select
								id="category"
								value={categoryId}
								onChange={(e) =>
									setCategoryId(e.target.value ? Number(e.target.value) : '')
								}
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
							>
								<option value="">No category</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="pinned"
							checked={isPinned}
							onChange={(e) => setIsPinned(e.target.checked)}
							className="rounded border-input"
						/>
						<Label htmlFor="pinned" className="font-normal">
							Pinned globally (shows on all dashboards)
						</Label>
					</div>

					<div className="flex justify-between pt-4">
						<div>
							{isEditing && (
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
							<Button type="submit" disabled={saving}>
								{saving ? 'Saving...' : isEditing ? 'Save' : 'Add Link'}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
