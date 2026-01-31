import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DragHandle, DragHandleProps } from '@/components/ui/sortable-list';
import { MarqueeText } from '@/components/ui/marquee-text';
import { ExternalLink, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { ServiceLink } from './LinkCard';

interface LinkBarItemProps {
	link: ServiceLink;
	isUserPinned?: boolean;
	onEdit?: (link: ServiceLink) => void;
	onDelete?: (link: ServiceLink) => void;
	onTogglePin?: (link: ServiceLink) => void;
	dragHandleProps?: DragHandleProps;
}

export function LinkBarItem({
	link,
	isUserPinned,
	onEdit,
	onDelete,
	onTogglePin,
	dragHandleProps,
}: LinkBarItemProps) {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-2 px-3 py-2 h-14 rounded-md border bg-card hover:bg-accent transition-colors min-w-0"
				>
					<DragHandle dragHandleProps={dragHandleProps} />
					<span className="text-lg flex-shrink-0">{link.icon || '🔗'}</span>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<MarqueeText className="font-medium text-sm flex-1 min-w-0">
								{link.title}
							</MarqueeText>
							{isUserPinned && (
								<Pin className="h-2.5 w-2.5 text-primary flex-shrink-0" />
							)}
						</div>
						{link.description && (
							<MarqueeText className="text-xs text-muted-foreground">
								{link.description}
							</MarqueeText>
						)}
					</div>
					<ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
