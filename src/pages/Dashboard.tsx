import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { LinksGrid } from '@/components/links/LinksGrid';
import { ServiceLink } from '@/components/links/LinkCard';
import { DocList } from '@/components/docs/DocList';
import { Document } from '@/components/docs/DocCard';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/auth';
import { Pin, FileText } from 'lucide-react';

export function Dashboard() {
	const { getAccessTokenSilently } = useAuth0();
	const [allLinks, setAllLinks] = useState<ServiceLink[]>([]);
	const [allDocs, setAllDocs] = useState<Document[]>([]);
	const [userFavoriteLinks, setUserFavoriteLinks] = useState<number[]>([]);
	const [userFavoriteDocs, setUserFavoriteDocs] = useState<number[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			const [linksRes, docsRes, prefsRes] = await Promise.all([
				authFetch('/api/links', getAccessTokenSilently),
				authFetch('/api/docs', getAccessTokenSilently),
				authFetch('/api/preferences', getAccessTokenSilently),
			]);

			if (!linksRes.ok) {
				throw new Error('Failed to fetch links');
			}

			const [linksData, docsData, prefsData] = await Promise.all([
				linksRes.json(),
				docsRes.ok ? docsRes.json() : { documents: [] },
				prefsRes.ok ? prefsRes.json() : { preferences: { favorite_links: [], favorite_docs: [] } },
			]);

			setAllLinks(linksData.links);
			setAllDocs(docsData.documents || []);
			setUserFavoriteLinks(prefsData.preferences?.favorite_links || []);
			setUserFavoriteDocs(prefsData.preferences?.favorite_docs || []);
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

	const handleToggleLinkPin = async (link: ServiceLink) => {
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
			setUserFavoriteLinks(data.favorites);
		} catch (err) {
			console.error('Error toggling pin:', err);
		}
	};

	const handleToggleDocPin = async (doc: Document) => {
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
			setUserFavoriteDocs(data.favorites);
		} catch (err) {
			console.error('Error toggling pin:', err);
		}
	};

	// Filter to show user's pinned links, fallback to globally pinned if none
	const pinnedLinks = userFavoriteLinks.length > 0
		? allLinks.filter((link) => userFavoriteLinks.includes(link.id))
		: allLinks.filter((link) => link.is_pinned);

	// Filter to show user's pinned docs
	const pinnedDocs = allDocs.filter((doc) => userFavoriteDocs.includes(doc.id));

	const hasUserLinkPins = userFavoriteLinks.length > 0;
	const hasUserDocPins = userFavoriteDocs.length > 0;

	return (
		<AppShell>
			<div className="space-y-8">
				<div>
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground">
						Quick access to your most used services and documents
					</p>
				</div>

				{error ? (
					<div className="text-destructive">{error}</div>
				) : (
					<>
						{/* Pinned Links Section */}
						<section>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold flex items-center gap-2">
									<Pin className="h-4 w-4" />
									{hasUserLinkPins ? 'Your Pinned Links' : 'Suggested Links'}
								</h2>
								{!hasUserLinkPins && !loading && pinnedLinks.length > 0 && (
									<p className="text-sm text-muted-foreground">
										Right-click any link to pin your favorites
									</p>
								)}
							</div>

							{!loading && pinnedLinks.length === 0 ? (
								<div className="text-center py-12 border rounded-lg bg-muted/30">
									<Pin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
									<p className="text-muted-foreground mb-4">
										No pinned links yet
									</p>
									<Link to="/links">
										<Button variant="outline">
											Browse Links to Pin
										</Button>
									</Link>
								</div>
							) : (
								<LinksGrid
									links={pinnedLinks}
									loading={loading}
									userFavorites={userFavoriteLinks}
									onTogglePin={handleToggleLinkPin}
								/>
							)}
						</section>

						{/* Pinned Documents Section */}
						{(hasUserDocPins || loading) && (
							<section>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-semibold flex items-center gap-2">
										<FileText className="h-4 w-4" />
										Pinned Documents
									</h2>
								</div>

								<DocList
									documents={pinnedDocs}
									loading={loading}
									userFavorites={userFavoriteDocs}
									onTogglePin={handleToggleDocPin}
								/>
							</section>
						)}
					</>
				)}
			</div>
		</AppShell>
	);
}
