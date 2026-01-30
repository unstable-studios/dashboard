import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch } from '@/lib/auth';
import { Copy, RefreshCw, Calendar, ExternalLink, Mail, Globe } from 'lucide-react';

// Common timezones for the dropdown
const COMMON_TIMEZONES = [
	{ value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
	{ value: 'America/Denver', label: 'Mountain Time (Denver)' },
	{ value: 'America/Chicago', label: 'Central Time (Chicago)' },
	{ value: 'America/New_York', label: 'Eastern Time (New York)' },
	{ value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
	{ value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
	{ value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
	{ value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
	{ value: 'Europe/London', label: 'GMT (London)' },
	{ value: 'Europe/Paris', label: 'Central European Time (Paris)' },
	{ value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
	{ value: 'Europe/Helsinki', label: 'Eastern European Time (Helsinki)' },
	{ value: 'Europe/Moscow', label: 'Moscow Time' },
	{ value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
	{ value: 'Asia/Kolkata', label: 'India Standard Time (Kolkata)' },
	{ value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok)' },
	{ value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)' },
	{ value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
	{ value: 'Asia/Seoul', label: 'Korea Standard Time (Seoul)' },
	{ value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
	{ value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland)' },
	// Additional supported timezones
	{ value: 'America/Tijuana', label: 'Pacific Time (Tijuana)' },
	{ value: 'America/Phoenix', label: 'Mountain Time (Phoenix)' },
	{ value: 'America/Mexico_City', label: 'Central Time (Mexico City)' },
	{ value: 'America/Bogota', label: 'Colombia Time (Bogota)' },
	{ value: 'America/Halifax', label: 'Atlantic Time (Halifax)' },
	{ value: 'America/Caracas', label: 'Venezuela Time (Caracas)' },
	{ value: 'America/Sao_Paulo', label: 'Brazil Time (Sao Paulo)' },
	{ value: 'America/Buenos_Aires', label: 'Argentina Time (Buenos Aires)' },
	{ value: 'Atlantic/Azores', label: 'Azores Time' },
	{ value: 'Atlantic/Cape_Verde', label: 'Cape Verde Time' },
	{ value: 'Atlantic/South_Georgia', label: 'South Georgia Time' },
	{ value: 'Europe/Dublin', label: 'GMT (Dublin)' },
	{ value: 'Europe/Madrid', label: 'Central European Time (Madrid)' },
	{ value: 'Europe/Athens', label: 'Eastern European Time (Athens)' },
	{ value: 'Africa/Cairo', label: 'Egypt Time (Cairo)' },
	{ value: 'Africa/Lagos', label: 'West Africa Time (Lagos)' },
	{ value: 'Africa/Casablanca', label: 'Morocco Time (Casablanca)' },
	{ value: 'Africa/Nairobi', label: 'East Africa Time (Nairobi)' },
	{ value: 'Asia/Muscat', label: 'Gulf Standard Time (Muscat)' },
	{ value: 'Asia/Kuwait', label: 'Arabia Standard Time (Kuwait)' },
	{ value: 'Asia/Karachi', label: 'Pakistan Time (Karachi)' },
	{ value: 'Asia/Tashkent', label: 'Uzbekistan Time (Tashkent)' },
	{ value: 'Asia/Dhaka', label: 'Bangladesh Time (Dhaka)' },
	{ value: 'Asia/Almaty', label: 'Kazakhstan Time (Almaty)' },
	{ value: 'Asia/Jakarta', label: 'Western Indonesian Time (Jakarta)' },
	{ value: 'Asia/Ho_Chi_Minh', label: 'Indochina Time (Ho Chi Minh)' },
	{ value: 'Asia/Singapore', label: 'Singapore Time' },
	{ value: 'Asia/Hong_Kong', label: 'Hong Kong Time' },
	{ value: 'Asia/Vladivostok', label: 'Vladivostok Time' },
	{ value: 'Australia/Perth', label: 'Australian Western Time (Perth)' },
	{ value: 'Australia/Melbourne', label: 'Australian Eastern Time (Melbourne)' },
	{ value: 'Pacific/Guam', label: 'Chamorro Time (Guam)' },
	{ value: 'Pacific/Noumea', label: 'New Caledonia Time (Noumea)' },
	{ value: 'Pacific/Fiji', label: 'Fiji Time' },
	{ value: 'Pacific/Midway', label: 'Samoa Time (Midway)' },
	{ value: 'Pacific/Pago_Pago', label: 'Samoa Time (Pago Pago)' },
];

interface EmailPreferences {
	timezone: string;
	email_notifications: boolean;
	email: string | null;
}

export function CalendarSettings() {
	const { getAccessTokenSilently, user } = useAuth0();
	const [subscriptionUrl, setSubscriptionUrl] = useState('');
	const [loading, setLoading] = useState(true);
	const [regenerating, setRegenerating] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
		timezone: 'America/Los_Angeles',
		email_notifications: true,
		email: null,
	});
	const [savingEmail, setSavingEmail] = useState(false);
	const [emailSaved, setEmailSaved] = useState(false);

	// Detect user's timezone on first load
	const detectedTimezone = useMemo(() => {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone;
		} catch {
			return 'America/Los_Angeles';
		}
	}, []);

	const fetchSettings = useCallback(async () => {
		try {
			const [tokenRes, prefsRes] = await Promise.all([
				authFetch('/api/calendar/token', getAccessTokenSilently),
				authFetch('/api/preferences', getAccessTokenSilently),
			]);

			if (tokenRes.ok) {
				const tokenData = await tokenRes.json();
				setSubscriptionUrl(tokenData.subscriptionUrl);
			}

			if (prefsRes.ok) {
				const prefsData = await prefsRes.json();
				setEmailPrefs({
					timezone: prefsData.preferences.timezone || detectedTimezone,
					email_notifications: prefsData.preferences.email_notifications ?? true,
					email: prefsData.preferences.email || user?.email || null,
				});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load settings');
		} finally {
			setLoading(false);
		}
	}, [getAccessTokenSilently, detectedTimezone, user?.email]);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

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

	const handleSaveEmailPrefs = async () => {
		setSavingEmail(true);
		setError(null);
		try {
			const res = await authFetch('/api/preferences', getAccessTokenSilently, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timezone: emailPrefs.timezone,
					email_notifications: emailPrefs.email_notifications,
					email: emailPrefs.email,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save preferences');
			}
			setEmailSaved(true);
			setTimeout(() => setEmailSaved(false), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save preferences');
		} finally {
			setSavingEmail(false);
		}
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
		<div className="space-y-6">
			{/* Email Notifications Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						Email Notifications
					</CardTitle>
					<CardDescription>
						Receive daily email reminders at 7am your local time when reminders are approaching
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
							{error}
						</div>
					)}

					<div className="flex items-center gap-3">
						<input
							type="checkbox"
							id="emailNotifications"
							checked={emailPrefs.email_notifications}
							onChange={(e) => setEmailPrefs({ ...emailPrefs, email_notifications: e.target.checked })}
							className="h-4 w-4 rounded border-gray-300"
						/>
						<Label htmlFor="emailNotifications" className="cursor-pointer">
							Enable email reminders
						</Label>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							value={emailPrefs.email || ''}
							onChange={(e) => setEmailPrefs({ ...emailPrefs, email: e.target.value || null })}
							placeholder="your@email.com"
							disabled={!emailPrefs.email_notifications}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="timezone" className="flex items-center gap-2">
							<Globe className="h-4 w-4" />
							Your Timezone
						</Label>
						<select
							id="timezone"
							value={emailPrefs.timezone}
							onChange={(e) => setEmailPrefs({ ...emailPrefs, timezone: e.target.value })}
							disabled={!emailPrefs.email_notifications}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{COMMON_TIMEZONES.map((tz) => (
								<option key={tz.value} value={tz.value}>
									{tz.label}
								</option>
							))}
						</select>
						<p className="text-xs text-muted-foreground">
							Emails are sent daily at 7am in your local time when you have upcoming reminders
						</p>
					</div>

					<Button
						type="button"
						onClick={handleSaveEmailPrefs}
						disabled={savingEmail}
					>
						{savingEmail ? 'Saving...' : 'Save Email Preferences'}
					</Button>
					{emailSaved && (
						<p className="text-xs text-green-600 dark:text-green-400">Preferences saved!</p>
					)}
				</CardContent>
			</Card>

			{/* Calendar Subscription Card */}
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
		</div>
	);
}
