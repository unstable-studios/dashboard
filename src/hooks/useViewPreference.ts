import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'grid' | 'list' | 'bar';

// Sections that can have independent view preferences
export type ViewSection =
	| 'links'
	| 'docs'
	| 'reminders'
	| 'dashboard-links'
	| 'dashboard-docs'
	| 'dashboard-reminders';

const STORAGE_KEY_PREFIX = 'view-preference';
const LEGACY_STORAGE_KEY = 'view-preference';

function getStorageKey(section?: ViewSection): string {
	return section ? `${STORAGE_KEY_PREFIX}-${section}` : LEGACY_STORAGE_KEY;
}

function isValidViewMode(value: string | null): value is ViewMode {
	return value === 'grid' || value === 'list' || value === 'bar';
}

export function useViewPreference(section?: ViewSection): [ViewMode, (mode: ViewMode) => void] {
	const storageKey = getStorageKey(section);

	const [viewMode, setViewModeState] = useState<ViewMode>(() => {
		// First try section-specific key
		const stored = localStorage.getItem(storageKey);
		if (isValidViewMode(stored)) {
			return stored;
		}
		// Fall back to legacy global key for migration
		if (section) {
			const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
			if (isValidViewMode(legacy)) {
				return legacy;
			}
		}
		return 'grid';
	});

	const setViewMode = useCallback((mode: ViewMode) => {
		setViewModeState(mode);
		localStorage.setItem(storageKey, mode);
	}, [storageKey]);

	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === storageKey) {
				if (isValidViewMode(e.newValue)) {
					setViewModeState(e.newValue);
				} else if (e.newValue === null) {
					setViewModeState('grid');
				}
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, [storageKey]);

	return [viewMode, setViewMode];
}
