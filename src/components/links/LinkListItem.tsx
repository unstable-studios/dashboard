import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DragHandle, DragHandleProps } from '@/components/ui/sortable-list';
import { ExternalLink, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { ServiceLink } from './LinkCard';

interface LinkListItemProps {
	link: ServiceLink;
	isUserPinned?: boolean;
	onEdit?: (link: ServiceLink) => void;
	onDelete?: (link: ServiceLink) => void;
	onTogglePin?: (link: ServiceLink) => void;
	dragHandleProps?: DragHandleProps;
}

export function LinkListItem({
	link,
	isUserPinned,
	onEdit,
	onDelete,
	onTogglePin,
	dragHandleProps,
}: LinkListItemProps) {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
				>
					<DragHandle dragHandleProps={dragHandleProps} />
					<div className="text-2xl flex-shrink-0">
						{link.icon || '🔗'}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold truncate">{link.title}</h3>
							{isUserPinned && (
								<Pin className="h-3 w-3 text-primary flex-shrink-0" />
							)}
						</div>
						{link.description && (
							<p className="text-sm text-muted-foreground truncate">
								{link.description}
							</p>
						)}
					</div>
					{link.category_name && (
						<span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded hidden sm:block">
							{link.category_name}
						</span>
					)}
					<ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				</a>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuItem
					onClick={(e) => {
						e.stopPropagation();
						window.open(link.url, '_blank', 'noopener,noreferrer');
					}}
				>
					<ExternalLink className="h-4 w-4 mr-2" />
					Open Link
				</ContextMenuItem>
				{onTogglePin && (
					<ContextMenuItem
						onClick={(e) => {
							e.stopPropagation();
							onTogglePin(link);
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
									onEdit(link);
								}}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Edit Link
							</ContextMenuItem>
						)}
						{onDelete && (
							<ContextMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onDelete(link);
								}}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Link
							</ContextMenuItem>
						)}
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
