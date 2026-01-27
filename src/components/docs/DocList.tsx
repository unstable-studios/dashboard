import { DocCard, Document } from './DocCard';

interface DocListProps {
	documents: Document[];
	loading?: boolean;
	isAdmin?: boolean;
	userFavorites?: number[];
	onEdit?: (doc: Document) => void;
	onDelete?: (doc: Document) => void;
	onTogglePin?: (doc: Document) => void;
}

export function DocList({ documents, loading, isAdmin, userFavorites, onEdit, onDelete, onTogglePin }: DocListProps) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
