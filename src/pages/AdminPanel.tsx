import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { authFetch } from '@/lib/auth';
import { Shield, ExternalLink } from 'lucide-react';

export function AdminPanel() {
	const { getAccessTokenSilently } = useAuth0();
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [userEmail, setUserEmail] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const meRes = await authFetch('/api/auth/me', getAccessTokenSilently);

				if (!meRes.ok) {
					setLoading(false);
					return;
				}

				const meData = await meRes.json();
				setIsAdmin(meData.isAdmin);
				setUserEmail(meData.email);
			} catch (err) {
				console.error('Error fetching admin data:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [getAccessTokenSilently]);

	if (loading) {
		return (
			<AppShell>
				<div className='space-y-6'>
					<div className='bg-muted h-8 w-48 animate-pulse rounded' />
					<div className='bg-muted h-48 animate-pulse rounded-lg' />
				</div>
			</AppShell>
		);
	}

	if (!isAdmin) {
		return (
			<AppShell>
				<div className='py-12 text-center'>
					<Shield className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
					<h1 className='mb-2 text-2xl font-bold'>Access Denied</h1>
					<p className='text-muted-foreground'>
						You do not have admin access to this page.
					</p>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<div className='max-w-2xl space-y-8'>
				<div>
					<h1 className='text-2xl font-bold'>Admin Panel</h1>
					<p className='text-muted-foreground'>
						Enterprise administration settings
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5' />
							Admin Access
						</CardTitle>
						<CardDescription>
							Admin roles are managed via Auth0 RBAC.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<p className='text-muted-foreground text-sm'>
							You are logged in as <strong>{userEmail}</strong> with admin
							permissions.
						</p>
						<p className='text-muted-foreground text-sm'>
							In the personal tier, users manage their own content via the
							Settings page. Admin access is used for enterprise organization
							management.
						</p>
						<div className='mt-4 border-t pt-4'>
							<p className='mb-2 text-sm font-medium'>Auth0 Management</p>
							<p className='text-muted-foreground mb-3 text-sm'>
								To manage admin access, assign the{' '}
								<code className='bg-muted rounded px-1'>admin</code> permission
								to users via Auth0 Dashboard.
							</p>
							<a
								href='https://manage.auth0.com/'
								target='_blank'
								rel='noopener noreferrer'
								className='text-primary inline-flex items-center gap-2 text-sm hover:underline'
							>
								Open Auth0 Dashboard
								<ExternalLink className='h-3 w-3' />
							</a>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Content Management</CardTitle>
						<CardDescription>
							How content is managed in dashboard
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<p className='text-sm font-medium'>Personal Content</p>
							<p className='text-muted-foreground text-sm'>
								Each user manages their own links, categories, and documents via
								the Settings page. Content is isolated per user - users can only
								see and edit their own content.
							</p>
						</div>
						<div className='space-y-2'>
							<p className='text-sm font-medium'>Enterprise Features</p>
							<p className='text-muted-foreground text-sm'>
								Organization-level content sharing and team management features
								are available in the Enterprise tier.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</AppShell>
	);
}
