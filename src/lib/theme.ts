export type Theme = 'light' | 'dark' | 'system';

export function getSystemTheme(): 'light' | 'dark' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
	const root = document.documentElement;
	if (theme === 'system') {
		const systemTheme = getSystemTheme();
		root.classList.toggle('dark', systemTheme === 'dark');
	} else {
		root.classList.toggle('dark', theme === 'dark');
	}
}

export function getStoredTheme(): Theme {
	try {
		const saved = localStorage.getItem('theme');

		if (saved === 'light' || saved === 'dark' || saved === 'system') {
			return saved;
		}
	} catch {
		// Ignore storage access errors and fall back to default.
	}

	return 'system';
}
