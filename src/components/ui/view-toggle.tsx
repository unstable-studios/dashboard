import { LayoutGrid, List } from 'lucide-react';
import { Button } from './button';
import { ViewMode } from '@/hooks/useViewPreference';

interface ViewToggleProps {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
	return (
		<div className="flex items-center border rounded-lg p-0.5" role="group" aria-label="View mode">
			<Button
				variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
				size="sm"
				className="h-8 w-8 p-0"
				onClick={() => onViewModeChange('grid')}
				aria-label="Grid view"
				aria-pressed={viewMode === 'grid'}
			>
				<LayoutGrid className="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === 'list' ? 'secondary' : 'ghost'}
				size="sm"
				className="h-8 w-8 p-0"
				onClick={() => onViewModeChange('list')}
				aria-label="List view"
				aria-pressed={viewMode === 'list'}
			>
				<List className="h-4 w-4" />
			</Button>
		</div>
	);
}
