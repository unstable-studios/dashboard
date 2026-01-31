import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LinksGrid } from '@/components/links/LinksGrid';
import { LinkDialog } from '@/components/links/LinkDialog';
import { ServiceLink } from '@/components/links/LinkCard';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/view-toggle';
import { authFetch } from '@/lib/auth';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useDynamicFilterPreference } from '@/hooks/useFilterPreference';
import { Plus } from 'lucide-react';

interface Category {
	id: number;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
}

export function LinksPage() {
	const { getAccessTokenSilently } = useAuth0();
	const [viewMode, setViewMode] = useViewPreference('links');
	const [links, setLinks] = useState<ServiceLink[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedCategorySlug, setSelectedCategorySlug] = useDynamicFilterPreference('links-category');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userFavorites, setUserFavorites] = useState<number[]>([]);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<ServiceLink | null>(null);

	const fetchData = async () => {
		try {
			const [linksRes, categoriesRes, prefsRes] = await Promise.all([
				authFetch('/api/links', getAccessTokenSilently),
				authFetch('/api/categories', getAccessTokenSilently),
				authFetch('/api/preferences', getAccessTokenSilently),
			]);

			if (!linksRes.ok || !categoriesRes.ok) {
				throw new Error('Failed to fetch data');
			}

			const [linksData, categoriesData, prefsData] = await Promise.all([
				linksRes.json(),
				categoriesRes.json(),
				prefsRes.ok ? prefsRes.json() : { preferences: { favorite_links: [] } },
			]);

			setLinks(linksData.links);
			setCategories(categoriesData.categories);
			setUserFavorites(prefsData.preferences?.favorite_links || []);
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

	const handleEdit = (link: ServiceLink) => {
		setEditingLink(link);
		setDialogOpen(true);
	};

	const handleDelete = async (link: ServiceLink) => {
		if (!confirm(`Are you sure you want to delete "${link.title}"?`)) return;

		try {
			const res = await authFetch(`/api/links/${link.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete link');
			}

			// Refresh links
			fetchData();
		} catch (err) {
			console.error('Error deleting link:', err);
			alert('Failed to delete link');
		}
	};

	const handleTogglePin = async (link: ServiceLink) => {
		try {
			const res = await authFetch(
				`/api/preferences/toggle-favorite/${link.id}`,
				getAccessTokenSilently,
				{ method: 'POST' }
			);

			if (!res.ok) {
				throw new Error('Failed to toggle pin');
			}

			const data = await res.json();
			setUserFavorites(data.favorites);
		} catch (err) {
			console.error('Error toggling pin:', err);
		}
	};

	const handleAddNew = () => {
		setEditingLink(null);
		setDialogOpen(true);
	};

	const handleDialogSaved = () => {
		fetchData();
	};

	// Find category ID from slug for filtering
	const selectedCategory = selectedCategorySlug
		? categories.find((c) => c.slug === selectedCategorySlug)?.id ?? null
		: null;

	const filteredLinks = selectedCategory
		? links.filter((link) => link.category_id === selectedCategory)
		: links;

	return (
		<AppShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Service Links</h1>
						<p className="text-muted-foreground">
							All your bookmarked services and tools
						</p>
					</div>
					<div className="flex items-center gap-3">
						<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
						<Button onClick={handleAddNew} className="gap-2">
							<Plus className="h-4 w-4" />
							Add Link
						</Button>
					</div>
				</div>

				{/* Category filter */}
				<div className="flex flex-wrap gap-2">
					<Button
						variant={selectedCategorySlug === null ? 'secondary' : 'outline'}
						size="sm"
						onClick={() => setSelectedCategorySlug(null)}
					>
						All
					</Button>
					{categories.map((category) => (
						<Button
							key={category.id}
							variant={selectedCategorySlug === category.slug ? 'secondary' : 'outline'}
							size="sm"
							onClick={() => setSelectedCategorySlug(category.slug)}
						>
							{category.icon && <span className="mr-1">{category.icon}</span>}
							{category.name}
						</Button>
					))}
				</div>

				{error ? (
					<div className="text-destructive">{error}</div>
				) : (
					<LinksGrid
						links={filteredLinks}
						loading={loading}
						userFavorites={userFavorites}
						viewMode={viewMode}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onTogglePin={handleTogglePin}
					/>
				)}
			</div>

			<LinkDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				link={editingLink}
				categories={categories}
				onSaved={handleDialogSaved}
			/>
		</AppShell>
	);
}
