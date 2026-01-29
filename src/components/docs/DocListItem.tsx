import { Link, useNavigate } from 'react-router';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DragHandle, DragHandleProps } from '@/components/ui/sortable-list';
import { FileText, ExternalLink, Pencil, Trash2, Eye, Pin, PinOff } from 'lucide-react';
import { Document } from './DocCard';

interface DocListItemProps {
	doc: Document;
	isAdmin?: boolean;
	isUserPinned?: boolean;
	onEdit?: (doc: Document) => void;
	onDelete?: (doc: Document) => void;
	onTogglePin?: (doc: Document) => void;
	dragHandleProps?: DragHandleProps;
}

export function DocListItem({ doc, isAdmin, isUserPinned, onEdit, onDelete, onTogglePin, dragHandleProps }: DocListItemProps) {
	const navigate = useNavigate();
	const isExternal = !!doc.external_url;

	const handleOpen = () => {
		if (isExternal && doc.external_url) {
			window.open(doc.external_url, '_blank', 'noopener,noreferrer');
		} else {
			navigate(`/docs/${doc.slug}`);
		}
	};

	const itemClassName = "flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors";

	const itemContent = (
		<>
			<DragHandle dragHandleProps={dragHandleProps} />
			<FileText className="h-5 w-5 text-muted-foreground shrink-0" />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<h3 className="font-semibold truncate">{doc.title}</h3>
					{isUserPinned && (
						<Pin className="h-3 w-3 text-primary shrink-0" />
					)}
				</div>
				{doc.excerpt && (
					<p className="text-sm text-muted-foreground truncate">
						{doc.excerpt}
					</p>
				)}
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{doc.category_name && (
					<span className="text-xs bg-secondary px-2 py-0.5 rounded hidden sm:block">
						{doc.category_name}
					</span>
				)}
				{!doc.is_published && (
					<span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
						Draft
					</span>
				)}
				{isExternal && (
					<ExternalLink className="h-4 w-4 text-muted-foreground" />
				)}
			</div>
		</>
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				{isExternal && doc.external_url ? (
					<a
						href={doc.external_url}
						target="_blank"
						rel="noopener noreferrer"
						className={itemClassName}
					>
						{itemContent}
					</a>
				) : (
					<Link to={`/docs/${doc.slug}`} className={itemClassName}>
						{itemContent}
					</Link>
				)}
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuItem onClick={handleOpen}>
					{isExternal ? (
						<>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open External Link
						</>
					) : (
						<>
							<Eye className="h-4 w-4 mr-2" />
							View Document
						</>
					)}
				</ContextMenuItem>
				{onTogglePin && (
					<ContextMenuItem
						onClick={(e) => {
							e.stopPropagation();
							onTogglePin(doc);
						}}
					>
						{isUserPinned ? (
							<>
								<PinOff className="h-4 w-4 mr-2" />
								Unpin from Dashboard
							</>
						) : (
							<>
								<Pin className="h-4 w-4 mr-2" />
								Pin to Dashboard
							</>
						)}
					</ContextMenuItem>
				)}
				{isAdmin && (
					<>
						<ContextMenuSeparator />
						{onEdit && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onEdit(doc);
								}}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Edit Document
							</ContextMenuItem>
						)}
						{onDelete && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onDelete(doc);
								}}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Document
							</ContextMenuItem>
						)}
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
