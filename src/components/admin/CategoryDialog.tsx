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

export interface Category {
	id: number;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
}

interface CategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category?: Category | null;
	onSaved: () => void;
}

export function CategoryDialog({
	open,
	onOpenChange,
	category,
	onSaved,
}: CategoryDialogProps) {
	const { getAccessTokenSilently } = useAuth0();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [icon, setIcon] = useState('');
	const [color, setColor] = useState('');

	const isEditing = !!category;

	useEffect(() => {
		if (category) {
			setName(category.name);
			setSlug(category.slug);
			setIcon(category.icon || '');
			setColor(category.color || '');
		} else {
			setName('');
			setSlug('');
			setIcon('');
			setColor('');
		}
		setError(null);
	}, [category, open]);

	// Auto-generate slug from name
	const handleNameChange = (value: string) => {
		setName(value);
		if (!isEditing) {
			setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const body = {
				name,
				slug,
				icon: icon || null,
				color: color || null,
			};

			const res = await authFetch(
				isEditing ? `/api/categories/${category.id}` : '/api/categories',
				getAccessTokenSilently,
				{
					method: isEditing ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save category');
			}

			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save category');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
					<DialogDescription>
						{isEditing ? 'Update category details.' : 'Create a new category for links and documents.'}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Category name"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="slug">Slug</Label>
						<Input
							id="slug"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="category-slug"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Icon</Label>
							<EmojiPicker value={icon} onChange={setIcon} />
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">Color (optional)</Label>
							<Input
								id="color"
								type="color"
								value={color || '#6366f1'}
								onChange={(e) => setColor(e.target.value)}
								className="h-9 p-1"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Saving...' : isEditing ? 'Save' : 'Add Category'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
