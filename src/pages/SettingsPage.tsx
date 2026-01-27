import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
	const root = document.documentElement;
	if (theme === 'system') {
		const systemTheme = getSystemTheme();
		root.classList.toggle('dark', systemTheme === 'dark');
	} else {
		root.classList.toggle('dark', theme === 'dark');
	}
}

export function SettingsPage() {
	const { user } = useAuth0();
	const [theme, setTheme] = useState<Theme>(() => {
		const saved = localStorage.getItem('theme') as Theme;
		return saved || 'system';
	});

	useEffect(() => {
		applyTheme(theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	// Listen for system theme changes when using 'system' theme
	useEffect(() => {
		if (theme !== 'system') return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => applyTheme('system');
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	}, [theme]);

	const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor },
	];

	return (
		<AppShell>
			<div className="space-y-8 max-w-2xl">
				<div>
					<h1 className="text-2xl font-bold">Settings</h1>
					<p className="text-muted-foreground">Manage your preferences</p>
				</div>

				{/* Profile */}
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>Your account information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							{user?.picture && (
								<img
									src={user.picture}
									alt={user.name || 'Profile'}
									className="h-16 w-16 rounded-full"
								/>
							)}
							<div>
								<p className="font-medium">{user?.name}</p>
								<p className="text-sm text-muted-foreground">{user?.email}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Appearance */}
				<Card>
					<CardHeader>
						<CardTitle>Appearance</CardTitle>
						<CardDescription>Customize how the app looks</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Theme</Label>
							<div className="flex gap-2">
								{themeOptions.map((option) => {
									const Icon = option.icon;
									return (
										<Button
											key={option.value}
											variant={theme === option.value ? 'secondary' : 'outline'}
											onClick={() => setTheme(option.value)}
											className="gap-2"
										>
											<Icon className="h-4 w-4" />
											{option.label}
										</Button>
									);
								})}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</AppShell>
	);
}
