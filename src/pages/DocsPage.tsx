import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { DocList } from '@/components/docs/DocList';
import { Document } from '@/components/docs/DocCard';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/view-toggle';
import { authFetch } from '@/lib/auth';
import { useViewPreference } from '@/hooks/useViewPreference';
import { Plus } from 'lucide-react';

interface Category {
	id: number;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
}

export function DocsPage() {
	const { getAccessTokenSilently } = useAuth0();
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useViewPreference();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [userFavorites, setUserFavorites] = useState<number[]>([]);

	const fetchData = async () => {
		try {
			// First get user info to check if admin
			const meRes = await authFetch('/api/auth/me', getAccessTokenSilently);
			const meData = meRes.ok ? await meRes.json() : { isAdmin: false };
			const userIsAdmin = meData.isAdmin || false;
			setIsAdmin(userIsAdmin);

			// Fetch docs with unpublished if admin
			const docsUrl = userIsAdmin ? '/api/docs?include_unpublished=true' : '/api/docs';

			const [docsRes, categoriesRes, prefsRes] = await Promise.all([
				authFetch(docsUrl, getAccessTokenSilently),
				authFetch('/api/categories', getAccessTokenSilently),
				authFetch('/api/preferences', getAccessTokenSilently),
			]);

			if (!docsRes.ok || !categoriesRes.ok) {
				throw new Error('Failed to fetch data');
			}

			const [docsData, categoriesData, prefsData] = await Promise.all([
				docsRes.json(),
				categoriesRes.json(),
				prefsRes.ok ? prefsRes.json() : { preferences: { favorite_docs: [] } },
			]);

			setDocuments(docsData.documents);
			setCategories(categoriesData.categories);
			setUserFavorites(prefsData.preferences?.favorite_docs || []);
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

	const handleEdit = (doc: Document) => {
		navigate(`/docs/${doc.slug}/edit`);
	};

	const handleDelete = async (doc: Document) => {
		if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

		try {
			const res = await authFetch(`/api/docs/${doc.slug}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete document');
			}

			fetchData();
		} catch (err) {
			console.error('Error deleting document:', err);
			alert('Failed to delete document');
		}
	};

	const handleTogglePin = async (doc: Document) => {
		try {
			const res = await authFetch(
				`/api/preferences/toggle-favorite-doc/${doc.id}`,
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

	const filteredDocs = selectedCategory
		? documents.filter((doc) => doc.category_id === selectedCategory)
		: documents;

	return (
		<AppShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Documents</h1>
						<p className="text-muted-foreground">
							Business processes and documentation
						</p>
					</div>
					<div className="flex items-center gap-3">
						<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
						{isAdmin && (
							<Link to="/docs/new">
								<Button className="gap-2">
									<Plus className="h-4 w-4" />
									New Document
								</Button>
							</Link>
						)}
					</div>
				</div>

				{/* Category filter */}
				<div className="flex flex-wrap gap-2">
					<Button
						variant={selectedCategory === null ? 'secondary' : 'outline'}
						size="sm"
						onClick={() => setSelectedCategory(null)}
					>
						All
					</Button>
					{categories.map((category) => (
						<Button
							key={category.id}
							variant={selectedCategory === category.id ? 'secondary' : 'outline'}
							size="sm"
							onClick={() => setSelectedCategory(category.id)}
						>
							{category.icon && <span className="mr-1">{category.icon}</span>}
							{category.name}
						</Button>
					))}
				</div>

				{error ? (
					<div className="text-destructive">{error}</div>
				) : (
					<DocList
						documents={filteredDocs}
						loading={loading}
						isAdmin={isAdmin}
						userFavorites={userFavorites}
						viewMode={viewMode}
						onEdit={isAdmin ? handleEdit : undefined}
						onDelete={isAdmin ? handleDelete : undefined}
						onTogglePin={handleTogglePin}
					/>
				)}
			</div>
		</AppShell>
	);
}
