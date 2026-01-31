import { useNavigate } from 'react-router';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DragHandle, DragHandleProps } from '@/components/ui/sortable-list';
import { MarqueeText } from '@/components/ui/marquee-text';
import { FileText, ExternalLink, Pencil, Trash2, Eye, Pin, PinOff } from 'lucide-react';
import { Document } from './DocCard';

interface DocBarItemProps {
	doc: Document;
	isUserPinned?: boolean;
	onEdit?: (doc: Document) => void;
	onDelete?: (doc: Document) => void;
	onTogglePin?: (doc: Document) => void;
	dragHandleProps?: DragHandleProps;
}

export function DocBarItem({
	doc,
	isUserPinned,
	onEdit,
	onDelete,
	onTogglePin,
	dragHandleProps,
}: DocBarItemProps) {
	const navigate = useNavigate();
	const isExternal = !!doc.external_url;

	const handleOpen = () => {
		if (isExternal && doc.external_url) {
			window.open(doc.external_url, '_blank', 'noopener,noreferrer');
		} else {
			navigate(`/docs/${doc.slug}`);
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		// Don't navigate if clicking on the drag handle
		if ((e.target as HTMLElement).closest('[aria-roledescription="sortable"]')) {
			return;
		}
		handleOpen();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleOpen();
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					role="button"
					tabIndex={0}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					className="group flex items-center gap-2 px-3 py-2 h-14 rounded-md border bg-card hover:bg-accent transition-colors min-w-0 w-full text-left cursor-pointer"
				>
					<DragHandle dragHandleProps={dragHandleProps} />
					<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<MarqueeText className="font-medium text-sm flex-1 min-w-0">
								{doc.title}
							</MarqueeText>
							{isUserPinned && (
								<Pin className="h-2.5 w-2.5 text-primary flex-shrink-0" />
							)}
							{!doc.is_published && (
								<span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1 rounded flex-shrink-0">
									Draft
								</span>
							)}
						</div>
						{doc.excerpt && (
							<MarqueeText className="text-xs text-muted-foreground">
								{doc.excerpt}
							</MarqueeText>
						)}
					</div>
					{isExternal && (
						<ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
					)}
				</div>
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
				{(onEdit || onDelete) && (
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
