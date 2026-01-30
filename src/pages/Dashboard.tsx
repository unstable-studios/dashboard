import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { LinksGrid } from '@/components/links/LinksGrid';
import { ServiceLink } from '@/components/links/LinkCard';
import { DocList } from '@/components/docs/DocList';
import { Document } from '@/components/docs/DocCard';
import {
	Reminder,
	CalendarPermissions,
} from '@/components/calendar/ReminderCard';
import { ReminderGrid } from '@/components/calendar/ReminderGrid';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/view-toggle';
import { authFetch } from '@/lib/auth';
import { useViewPreference } from '@/hooks/useViewPreference';
import { isUpcomingOrPastDue } from '@/lib/calendar';
import { Pin, FileText, Bell } from 'lucide-react';

const DEFAULT_PERMISSIONS: CalendarPermissions = {
	canRead: false,
	canAddUser: false,
	canAddGlobal: false,
	canEditUser: false,
	canEditGlobal: false,
	canDeleteUser: false,
	canDeleteGlobal: false,
};

export function Dashboard() {
	const { getAccessTokenSilently } = useAuth0();
	const [viewMode, setViewMode] = useViewPreference();
	const [allLinks, setAllLinks] = useState<ServiceLink[]>([]);
	const [allDocs, setAllDocs] = useState<Document[]>([]);
	const [reminders, setReminders] = useState<Reminder[]>([]);
	const [calendarPermissions, setCalendarPermissions] =
		useState<CalendarPermissions>(DEFAULT_PERMISSIONS);
	const [currentUserId, setCurrentUserId] = useState('');
	const [userFavoriteLinks, setUserFavoriteLinks] = useState<number[]>([]);
	const [userFavoriteDocs, setUserFavoriteDocs] = useState<number[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			const [linksRes, docsRes, prefsRes, remindersRes, meRes] =
				await Promise.all([
					authFetch('/api/links', getAccessTokenSilently),
					authFetch('/api/docs', getAccessTokenSilently),
					authFetch('/api/preferences', getAccessTokenSilently),
					authFetch('/api/reminders', getAccessTokenSilently),
					authFetch('/api/auth/me', getAccessTokenSilently),
				]);

			if (!linksRes.ok) {
				throw new Error('Failed to fetch links');
			}

			const [linksData, docsData, prefsData, remindersData, meData] =
				await Promise.all([
					linksRes.json(),
					docsRes.ok ? docsRes.json() : { documents: [] },
					prefsRes.ok
						? prefsRes.json()
						: { preferences: { favorite_links: [], favorite_docs: [] } },
					remindersRes.ok ? remindersRes.json() : { reminders: [] },
					meRes.ok ? meRes.json() : { calendar: DEFAULT_PERMISSIONS, sub: '' },
				]);

			setAllLinks(linksData.links);
			setAllDocs(docsData.documents || []);
			setUserFavoriteLinks(prefsData.preferences?.favorite_links || []);
			setUserFavoriteDocs(prefsData.preferences?.favorite_docs || []);
			setReminders(remindersData.reminders || []);
			setCalendarPermissions(meData.calendar || DEFAULT_PERMISSIONS);
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

	const handleReorderLinks = async (orderedIds: number[]) => {
		const previousOrder = [...userFavoriteLinks];
		setUserFavoriteLinks(orderedIds);
		try {
			const res = await authFetch('/api/preferences', getAccessTokenSilently, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ favorite_links: orderedIds }),
			});

			if (!res.ok) {
				throw new Error('Failed to save link order');
			}
		} catch (err) {
			console.error('Error saving link order:', err);
			setUserFavoriteLinks(previousOrder);
		}
	};

	const handleReorderDocs = async (orderedIds: number[]) => {
		const previousOrder = [...userFavoriteDocs];
		setUserFavoriteDocs(orderedIds);
		try {
			const res = await authFetch('/api/preferences', getAccessTokenSilently, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ favorite_docs: orderedIds }),
			});

			if (!res.ok) {
				throw new Error('Failed to save doc order');
			}
		} catch (err) {
			console.error('Error saving doc order:', err);
			setUserFavoriteDocs(previousOrder);
		}
	};

	// Filter and sort to show user's pinned links in their preferred order,
	// fallback to globally pinned if none
	const pinnedLinks =
		userFavoriteLinks.length > 0
			? userFavoriteLinks
					.map((id) => allLinks.find((link) => link.id === id))
					.filter((link): link is ServiceLink => link !== undefined)
			: allLinks.filter((link) => link.is_pinned);

	// Filter and sort to show user's pinned docs in their preferred order
	const pinnedDocs = userFavoriteDocs
		.map((id) => allDocs.find((doc) => doc.id === id))
		.filter((doc): doc is Document => doc !== undefined);

	const hasUserLinkPins = userFavoriteLinks.length > 0;
	const hasUserDocPins = userFavoriteDocs.length > 0;

	// Filter for upcoming reminders (within advance notice or past due), limit to 6
	const upcomingReminders = reminders
		.filter((r) => isUpcomingOrPastDue(r.next_due, r.advance_notice_days))
		.sort(
			(a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime()
		)
		.slice(0, 6);

	return (
		<AppShell>
			<div className='space-y-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-bold'>Dashboard</h1>
					</div>
					<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
				</div>

				{error ? (
					<div className='text-destructive'>{error}</div>
				) : (
					<>
						{/* Upcoming Reminders Section */}
						{!loading && upcomingReminders.length > 0 && (
							<section>
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='flex items-center gap-2 text-lg font-semibold'>
										<Bell className='h-4 w-4' />
										Upcoming Reminders
									</h2>
									<Link to='/calendar'>
										<Button variant='ghost' size='sm'>
											View All
										</Button>
									</Link>
								</div>

								<ReminderGrid
									reminders={upcomingReminders}
									loading={false}
									currentUserId={currentUserId}
									permissions={calendarPermissions}
									viewMode={viewMode}
								/>
							</section>
						)}

						{/* Pinned Links Section */}
						<section>
							<div className='mb-4 flex items-center justify-between'>
								<h2 className='flex items-center gap-2 text-lg font-semibold'>
									<Pin className='h-4 w-4' />
									{hasUserLinkPins ? 'Pinned Links' : 'Suggested Links'}
								</h2>
								{!hasUserLinkPins && !loading && pinnedLinks.length > 0 && (
									<p className='text-muted-foreground text-sm'>
										Right-click any link to pin your favorites
									</p>
								)}
								{hasUserLinkPins && !loading && pinnedLinks.length > 0 && (
									<Link to='/links'>
										<Button variant='ghost' size='sm'>
											View All
										</Button>
									</Link>
								)}
							</div>

							{!loading && pinnedLinks.length === 0 ? (
								<div className='bg-muted/30 rounded-lg border py-12 text-center'>
									<Pin className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
									<p className='text-muted-foreground mb-4'>
										No pinned links yet
									</p>
									<Link to='/links'>
										<Button variant='outline'>Browse Links to Pin</Button>
									</Link>
								</div>
							) : (
								<LinksGrid
									links={pinnedLinks}
									loading={loading}
									userFavorites={userFavoriteLinks}
									viewMode={viewMode}
									onTogglePin={handleToggleLinkPin}
									onReorder={hasUserLinkPins ? handleReorderLinks : undefined}
								/>
							)}
						</section>

						{/* Pinned Documents Section */}
						{(hasUserDocPins || loading) && (
							<section>
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='flex items-center gap-2 text-lg font-semibold'>
										<FileText className='h-4 w-4' />
										Pinned Documents
									</h2>
									{!loading && pinnedDocs.length > 0 && (
										<Link to='/docs'>
											<Button variant='ghost' size='sm'>
												View All
											</Button>
										</Link>
									)}
								</div>

								<DocList
									documents={pinnedDocs}
									loading={loading}
									userFavorites={userFavoriteDocs}
									viewMode={viewMode}
									onTogglePin={handleToggleDocPin}
									onReorder={hasUserDocPins ? handleReorderDocs : undefined}
								/>
							</section>
						)}
					</>
				)}
			</div>
		</AppShell>
	);
}
