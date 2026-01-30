import { LinkCard, ServiceLink } from './LinkCard';
import { LinkListItem } from './LinkListItem';
import { SortableList } from '@/components/ui/sortable-list';
import { ViewMode } from '@/hooks/useViewPreference';

interface LinksGridProps {
	links: ServiceLink[];
	loading?: boolean;
	isAdmin?: boolean;
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
	isAdmin,
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
							isAdmin={isAdmin}
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
						isAdmin={isAdmin}
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
						isAdmin={isAdmin}
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
					isAdmin={isAdmin}
					isUserPinned={userFavorites.includes(link.id)}
					onEdit={onEdit}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			))}
		</div>
	);
}
