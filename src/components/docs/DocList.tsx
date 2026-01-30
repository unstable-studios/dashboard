import { DocCard, Document } from './DocCard';
import { DocListItem } from './DocListItem';
import { DocBarItem } from './DocBarItem';
import { SortableList } from '@/components/ui/sortable-list';
import { ViewMode } from '@/hooks/useViewPreference';

interface DocListProps {
	documents: Document[];
	loading?: boolean;
	isAdmin?: boolean;
	userFavorites?: number[];
	viewMode?: ViewMode;
	onEdit?: (doc: Document) => void;
	onDelete?: (doc: Document) => void;
	onTogglePin?: (doc: Document) => void;
	onReorder?: (orderedIds: number[]) => void;
}

export function DocList({ documents, loading, isAdmin, userFavorites, viewMode = 'grid', onEdit, onDelete, onTogglePin, onReorder }: DocListProps) {
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
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="h-32 rounded-lg bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (documents.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				No documents found
			</div>
		);
	}

	if (viewMode === 'list') {
		if (onReorder) {
			return (
				<SortableList
					items={documents}
					onReorder={onReorder}
					layout="list"
					renderItem={(doc, dragHandleProps) => (
						<DocListItem
							doc={doc}
							isAdmin={isAdmin}
							isUserPinned={userFavorites?.includes(doc.id)}
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
				{documents.map((doc) => (
					<DocListItem
						key={doc.id}
						doc={doc}
						isAdmin={isAdmin}
						isUserPinned={userFavorites?.includes(doc.id)}
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
					items={documents}
					onReorder={onReorder}
					layout="bar"
					renderItem={(doc, dragHandleProps) => (
						<DocBarItem
							doc={doc}
							isAdmin={isAdmin}
							isUserPinned={userFavorites?.includes(doc.id)}
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
				{documents.map((doc) => (
					<DocBarItem
						key={doc.id}
						doc={doc}
						isAdmin={isAdmin}
						isUserPinned={userFavorites?.includes(doc.id)}
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
				items={documents}
				onReorder={onReorder}
				layout="grid"
				renderItem={(doc, dragHandleProps) => (
					<DocCard
						doc={doc}
						isAdmin={isAdmin}
						isUserPinned={userFavorites?.includes(doc.id)}
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
			{documents.map((doc) => (
				<DocCard
					key={doc.id}
					doc={doc}
					isAdmin={isAdmin}
					isUserPinned={userFavorites?.includes(doc.id)}
					onEdit={onEdit}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			))}
		</div>
	);
}
