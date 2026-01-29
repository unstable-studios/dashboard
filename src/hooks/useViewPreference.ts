import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'view-preference';

export function useViewPreference(): [ViewMode, (mode: ViewMode) => void] {
	const [viewMode, setViewModeState] = useState<ViewMode>(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		return (stored === 'list' || stored === 'grid') ? stored : 'grid';
	});

	const setViewMode = useCallback((mode: ViewMode) => {
		setViewModeState(mode);
		localStorage.setItem(STORAGE_KEY, mode);
	}, []);

	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) {
				if (e.newValue === 'list' || e.newValue === 'grid') {
					setViewModeState(e.newValue);
				} else if (e.newValue === null) {
					// Reset to default when the key is removed
					setViewModeState('grid');
				}
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, []);

	return [viewMode, setViewMode];
}
