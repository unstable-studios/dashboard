import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch } from '@/lib/auth';
import { Copy, RefreshCw, Calendar, ExternalLink } from 'lucide-react';

export function CalendarSettings() {
	const { getAccessTokenSilently } = useAuth0();
	const [subscriptionUrl, setSubscriptionUrl] = useState('');
	const [loading, setLoading] = useState(true);
	const [regenerating, setRegenerating] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchToken = async () => {
		try {
			const res = await authFetch('/api/calendar/token', getAccessTokenSilently);
			if (!res.ok) {
				throw new Error('Failed to fetch calendar token');
			}
			const data = await res.json();
			setSubscriptionUrl(data.subscriptionUrl);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load settings');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchToken();
	}, [getAccessTokenSilently]);

	const handleRegenerate = async () => {
		if (!confirm('Are you sure? This will invalidate your current calendar subscription URL. You will need to re-subscribe in your calendar app.')) {
			return;
		}

		setRegenerating(true);
		setError(null);
		try {
			const res = await authFetch('/api/calendar/token/regenerate', getAccessTokenSilently, {
				method: 'POST',
			});
			if (!res.ok) {
				throw new Error('Failed to regenerate token');
			}
			const data = await res.json();
			setSubscriptionUrl(data.subscriptionUrl);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to regenerate token');
		} finally {
			setRegenerating(false);
		}
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(subscriptionUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback: show prompt so user can manually copy
			window.prompt('Copy this calendar subscription URL:', subscriptionUrl);
		}
	};

	const handleSubscribe = () => {
		// Convert https:// to webcal:// for native calendar app subscription
		const webcalUrl = subscriptionUrl.replace(/^https?:\/\//, 'webcal://');
		window.open(webcalUrl, '_blank');
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Calendar Subscription
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					Calendar Subscription
				</CardTitle>
				<CardDescription>
					Subscribe to your reminders in any calendar app (Apple Calendar, Google Calendar, Outlook, etc.)
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
						{error}
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="subscriptionUrl">Subscription URL</Label>
					<div className="flex gap-2">
						<Input
							id="subscriptionUrl"
							value={subscriptionUrl}
							readOnly
							className="font-mono text-xs"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleCopy}
							title="Copy to clipboard"
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
					{copied && (
						<p className="text-xs text-green-600 dark:text-green-400">Copied to clipboard!</p>
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleSubscribe}
						className="gap-2"
					>
						<ExternalLink className="h-4 w-4" />
						Subscribe in Calendar App
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={handleRegenerate}
						disabled={regenerating}
						className="gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
						{regenerating ? 'Regenerating...' : 'Regenerate Token'}
					</Button>
				</div>

				<p className="text-xs text-muted-foreground">
					This URL contains a secret token. Do not share it with others. If you suspect it has been compromised, click "Regenerate Token" to create a new one.
				</p>
			</CardContent>
		</Card>
	);
}
