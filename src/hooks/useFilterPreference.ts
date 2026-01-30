import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'filter-preference';

function getStorageKey(section: string): string {
	return `${STORAGE_KEY_PREFIX}-${section}`;
}

// For string-based filters with a fixed set of valid values
export function useFilterPreference<T extends string>(
	section: string,
	defaultValue: T,
	validValues: readonly T[]
): [T, (value: T) => void] {
	const storageKey = getStorageKey(section);

	const [filter, setFilterState] = useState<T>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored && validValues.includes(stored as T)) {
			return stored as T;
		}
		return defaultValue;
	});

	const setFilter = useCallback(
		(value: T) => {
			setFilterState(value);
			localStorage.setItem(storageKey, value);
		},
		[storageKey]
	);

	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === storageKey) {
				if (e.newValue && validValues.includes(e.newValue as T)) {
					setFilterState(e.newValue as T);
				} else if (e.newValue === null) {
					setFilterState(defaultValue);
				}
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, [storageKey, defaultValue, validValues]);

	return [filter, setFilter];
}

// For dynamic string filters (like category slugs) that don't have a fixed set
export function useDynamicFilterPreference(
	section: string,
	defaultValue: string | null = null
): [string | null, (value: string | null) => void] {
	const storageKey = getStorageKey(section);

	const [filter, setFilterState] = useState<string | null>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored === '') return null;
		return stored;
	});

	const setFilter = useCallback(
		(value: string | null) => {
			setFilterState(value);
			if (value === null) {
				localStorage.removeItem(storageKey);
			} else {
				localStorage.setItem(storageKey, value);
			}
		},
		[storageKey]
	);

	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === storageKey) {
				if (e.newValue === null || e.newValue === '') {
					setFilterState(defaultValue);
				} else {
					setFilterState(e.newValue);
				}
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, [storageKey, defaultValue]);

	return [filter, setFilter];
}
