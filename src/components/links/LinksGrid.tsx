import { LinkCard, ServiceLink } from './LinkCard';
import { LinkListItem } from './LinkListItem';
import { LinkBarItem } from './LinkBarItem';
import { SortableList } from '@/components/ui/sortable-list';
import { ViewMode } from '@/hooks/useViewPreference';

interface LinksGridProps {
	links: ServiceLink[];
	loading?: boolean;
	userFavorites?: number[];
	viewMode?: ViewMode;
	onEdit?: (link: ServiceLink) => void;
	onDelete?: (link: ServiceLink) => void;
	onTogglePin?: (link: ServiceLink) => void;
	onReorder?: (orderedIds: number[]) => void;
}

export function LinksGrid({
	links,
	loading,
	userFavorites = [],
	viewMode = 'grid',
	onEdit,
	onDelete,
	onTogglePin,
	onReorder,
}: LinksGridProps) {
	if (loading) {
		if (viewMode === 'list') {
			return (
				<div className="space-y-2">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-16 rounded-lg bg-muted animate-pulse"
						/>
					))}
				</div>
			);
		}
		if (viewMode === 'bar') {
			return (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
					{[...Array(12)].map((_, i) => (
						<div
							key={i}
							className="h-14 rounded-md bg-muted animate-pulse"
						/>
					))}
				</div>
			);
		}
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{[...Array(8)].map((_, i) => (
					<div
						key={i}
						className="h-24 rounded-lg bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (links.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				No links found
			</div>
		);
	}

	if (viewMode === 'list') {
		if (onReorder) {
			return (
				<SortableList
					items={links}
					onReorder={onReorder}
					layout="list"
					renderItem={(link, dragHandleProps) => (
						<LinkListItem
							link={link}
														isUserPinned={userFavorites.includes(link.id)}
							onEdit={onEdit}
							onDelete={onDelete}
							onTogglePin={onTogglePin}
							dragHandleProps={dragHandleProps}
						/>
					)}
				/>
			);
		}
		return (
			<div className="space-y-2">
				{links.map((link) => (
					<LinkListItem
						key={link.id}
						link={link}
												isUserPinned={userFavorites.includes(link.id)}
						onEdit={onEdit}
						onDelete={onDelete}
						onTogglePin={onTogglePin}
					/>
				))}
			</div>
		);
	}

	if (viewMode === 'bar') {
		if (onReorder) {
			return (
				<SortableList
					items={links}
					onReorder={onReorder}
					layout="bar"
					renderItem={(link, dragHandleProps) => (
						<LinkBarItem
							link={link}
														isUserPinned={userFavorites.includes(link.id)}
							onEdit={onEdit}
							onDelete={onDelete}
							onTogglePin={onTogglePin}
							dragHandleProps={dragHandleProps}
						/>
					)}
				/>
			);
		}
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
				{links.map((link) => (
					<LinkBarItem
						key={link.id}
						link={link}
												isUserPinned={userFavorites.includes(link.id)}
						onEdit={onEdit}
						onDelete={onDelete}
						onTogglePin={onTogglePin}
					/>
				))}
			</div>
		);
	}

	if (onReorder) {
		return (
			<SortableList
				items={links}
				onReorder={onReorder}
				layout="grid"
				renderItem={(link, dragHandleProps) => (
					<LinkCard
						link={link}
												isUserPinned={userFavorites.includes(link.id)}
						onEdit={onEdit}
						onDelete={onDelete}
						onTogglePin={onTogglePin}
						dragHandleProps={dragHandleProps}
					/>
				)}
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{links.map((link) => (
				<LinkCard
					key={link.id}
					link={link}
										isUserPinned={userFavorites.includes(link.id)}
					onEdit={onEdit}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			))}
		</div>
	);
}
