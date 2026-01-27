import { Card, CardContent } from '@/components/ui/card';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ExternalLink, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';

export interface ServiceLink {
	id: number;
	title: string;
	description: string | null;
	url: string;
	icon: string | null;
	icon_type: string;
	category_id: number | null;
	category_name: string | null;
	category_slug: string | null;
	is_pinned: number;
	sort_order: number;
}

interface LinkCardProps {
	link: ServiceLink;
	isAdmin?: boolean;
	isUserPinned?: boolean;
	onEdit?: (link: ServiceLink) => void;
	onDelete?: (link: ServiceLink) => void;
	onTogglePin?: (link: ServiceLink) => void;
}

export function LinkCard({
	link,
	isAdmin,
	isUserPinned,
	onEdit,
	onDelete,
	onTogglePin,
}: LinkCardProps) {
	const handleClick = () => {
		// Open link in new tab
		window.open(link.url, '_blank', 'noopener,noreferrer');
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div onClick={handleClick} className="block cursor-pointer">
					<Card className="hover:bg-accent transition-colors h-full">
						<CardContent className="p-4">
							<div className="flex items-start gap-3">
								<div className="text-2xl flex-shrink-0">
									{link.icon || '🔗'}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h3 className="font-medium truncate">{link.title}</h3>
										{isUserPinned && (
											<Pin className="h-3 w-3 text-primary flex-shrink-0" />
										)}
										<ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
									</div>
									{link.description && (
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{link.description}
										</p>
									)}
									{link.category_name && (
										<span className="text-xs text-muted-foreground mt-2 inline-block">
											{link.category_name}
										</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
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
				{isAdmin && (
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
