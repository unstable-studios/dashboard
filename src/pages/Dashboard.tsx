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
import { Card, CardContent } from '@/components/ui/card';
import { authFetch } from '@/lib/auth';
import { useViewPreference } from '@/hooks/useViewPreference';
import { isUpcomingOrPastDue } from '@/lib/calendar';
import { Pin, FileText, Bell, Sparkles, X } from 'lucide-react';

const DEFAULT_PERMISSIONS: CalendarPermissions = {
	canRead: false,
	canAddUser: false,
	canAddGlobal: false,
	canEditUser: false,
	canEditGlobal: false,
	canDeleteUser: false,
	canDeleteGlobal: false,
};

// Initialize onboarding for new users
async function initializeOnboarding(
	getAccessTokenSilently: () => Promise<string>
): Promise<boolean> {
	try {
		const res = await authFetch('/api/onboarding/initialize', getAccessTokenSilently, {
			method: 'POST',
		});
		if (res.ok) {
			const data = await res.json();
			return !data.alreadyCompleted;
		}
	} catch (err) {
		console.error('Error initializing onboarding:', err);
	}
	return false;
}

export function Dashboard() {
	const { getAccessTokenSilently } = useAuth0();
	const [linksViewMode, setLinksViewMode] = useViewPreference('dashboard-links');
	const [docsViewMode, setDocsViewMode] = useViewPreference('dashboard-docs');
	const [remindersViewMode, setRemindersViewMode] = useViewPreference('dashboard-reminders');
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
	const [showWelcome, setShowWelcome] = useState(false);

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

			// Check if new user needs onboarding
			if (meData.onboardingCompleted === false) {
				const wasNewUser = await initializeOnboarding(getAccessTokenSilently);
				if (wasNewUser) {
					setShowWelcome(true);
					// Refetch data after onboarding to get newly created content
					const [newLinksRes, newDocsRes, newRemindersRes] = await Promise.all([
						authFetch('/api/links', getAccessTokenSilently),
						authFetch('/api/docs', getAccessTokenSilently),
						authFetch('/api/reminders', getAccessTokenSilently),
					]);
					if (newLinksRes.ok) {
						const newLinksData = await newLinksRes.json();
						setAllLinks(newLinksData.links);
					}
					if (newDocsRes.ok) {
						const newDocsData = await newDocsRes.json();
						setAllDocs(newDocsData.documents || []);
					}
					if (newRemindersRes.ok) {
						const newRemindersData = await newRemindersRes.json();
						setReminders(newRemindersData.reminders || []);
					}
				}
			}
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
				<div>
					<h1 className='text-2xl font-bold'>Dashboard</h1>
				</div>

				{error ? (
					<div className='text-destructive'>{error}</div>
				) : (
					<>
						{/* Welcome Banner for New Users */}
						{showWelcome && (
							<Card className='border-primary/20 bg-primary/5 relative'>
								<CardContent className='flex items-start gap-4 py-4'>
									<Sparkles className='text-primary h-6 w-6 flex-shrink-0 mt-0.5' />
									<div className='flex-1 min-w-0'>
										<h3 className='font-semibold'>Welcome to Dashboard!</h3>
										<p className='text-muted-foreground text-sm mt-1'>
											We&apos;ve set up some starter content for you. Check out your new links,
											read the welcome document, and explore the calendar for your first reminder.
										</p>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='flex-shrink-0 h-8 w-8'
										onClick={() => setShowWelcome(false)}
									>
										<X className='h-4 w-4' />
									</Button>
								</CardContent>
							</Card>
						)}

						{/* Upcoming Reminders Section */}
						{!loading && upcomingReminders.length > 0 && (
							<section>
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='flex items-center gap-2 text-lg font-semibold'>
										<Bell className='h-4 w-4' />
										Upcoming Reminders
									</h2>
									<div className='flex items-center gap-2'>
										<ViewToggle viewMode={remindersViewMode} onViewModeChange={setRemindersViewMode} />
										<Link to='/calendar'>
											<Button variant='ghost' size='sm'>
												View All
											</Button>
										</Link>
									</div>
								</div>

								<ReminderGrid
									reminders={upcomingReminders}
									loading={false}
									currentUserId={currentUserId}
									permissions={calendarPermissions}
									viewMode={remindersViewMode}
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
								<div className='flex items-center gap-2'>
									{!hasUserLinkPins && !loading && pinnedLinks.length > 0 && (
										<p className='text-muted-foreground text-sm hidden sm:block'>
											Right-click any link to pin your favorites
										</p>
									)}
									<ViewToggle viewMode={linksViewMode} onViewModeChange={setLinksViewMode} />
									{hasUserLinkPins && !loading && pinnedLinks.length > 0 && (
										<Link to='/links'>
											<Button variant='ghost' size='sm'>
												View All
											</Button>
										</Link>
									)}
								</div>
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
									viewMode={linksViewMode}
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
									<div className='flex items-center gap-2'>
										<ViewToggle viewMode={docsViewMode} onViewModeChange={setDocsViewMode} />
										{!loading && pinnedDocs.length > 0 && (
											<Link to='/docs'>
												<Button variant='ghost' size='sm'>
													View All
												</Button>
											</Link>
										)}
									</div>
								</div>

								<DocList
									documents={pinnedDocs}
									loading={loading}
									userFavorites={userFavoriteDocs}
									viewMode={docsViewMode}
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
