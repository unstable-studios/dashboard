import { features, type Features } from '@/lib/features';

// Simple hook to access feature flags
// Currently returns static config, but could be extended to support
// runtime feature toggles or user-specific features from API
export function useFeatures(): Features {
	return features;
}
