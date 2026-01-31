import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
				<div className="space-y-6">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-48 bg-muted animate-pulse rounded-lg" />
				</div>
			</AppShell>
		);
	}

	if (!isAdmin) {
		return (
			<AppShell>
				<div className="text-center py-12">
					<Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h1 className="text-2xl font-bold mb-2">Access Denied</h1>
					<p className="text-muted-foreground">
						You do not have admin access to this page.
					</p>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<div className="space-y-8 max-w-2xl">
				<div>
					<h1 className="text-2xl font-bold">Admin Panel</h1>
					<p className="text-muted-foreground">Enterprise administration settings</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Admin Access
						</CardTitle>
						<CardDescription>
							Admin roles are managed via Auth0 RBAC.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							You are logged in as <strong>{userEmail}</strong> with admin permissions.
						</p>
						<p className="text-sm text-muted-foreground">
							In the personal tier, users manage their own content via the Settings page.
							Admin access is used for enterprise organization management.
						</p>
						<div className="border-t pt-4 mt-4">
							<p className="text-sm font-medium mb-2">Auth0 Management</p>
							<p className="text-sm text-muted-foreground mb-3">
								To manage admin access, assign the <code className="bg-muted px-1 rounded">admin</code> permission
								to users via Auth0 Dashboard.
							</p>
							<a
								href="https://manage.auth0.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
							>
								Open Auth0 Dashboard
								<ExternalLink className="h-3 w-3" />
							</a>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Content Management</CardTitle>
						<CardDescription>
							How content is managed in echo-hub
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<p className="text-sm font-medium">Personal Content</p>
							<p className="text-sm text-muted-foreground">
								Each user manages their own links, categories, and documents via the Settings page.
								Content is isolated per user - users can only see and edit their own content.
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Enterprise Features</p>
							<p className="text-sm text-muted-foreground">
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
