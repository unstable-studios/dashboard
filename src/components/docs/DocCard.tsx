import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DragHandle, DragHandleProps } from '@/components/ui/sortable-list';
import { FileText, ExternalLink, Pencil, Trash2, Eye, Pin, PinOff } from 'lucide-react';

export interface Document {
	id: number;
	title: string;
	slug: string;
	content: string | null;
	excerpt: string | null;
	category_id: number | null;
	category_name: string | null;
	category_slug: string | null;
	external_url: string | null;
	external_type: string | null;
	is_published: number;
	created_at: string;
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
}

interface DocCardProps {
	doc: Document;
	isUserPinned?: boolean;
	onEdit?: (doc: Document) => void;
	onDelete?: (doc: Document) => void;
	onTogglePin?: (doc: Document) => void;
	dragHandleProps?: DragHandleProps;
}

export function DocCard({ doc, isUserPinned, onEdit, onDelete, onTogglePin, dragHandleProps }: DocCardProps) {
	const navigate = useNavigate();
	const isExternal = !!doc.external_url;

	const handleClick = () => {
		if (isExternal && doc.external_url) {
			window.open(doc.external_url, '_blank', 'noopener,noreferrer');
		} else {
			navigate(`/docs/${doc.slug}`);
		}
	};

	const handleOpen = () => {
		if (isExternal && doc.external_url) {
			window.open(doc.external_url, '_blank', 'noopener,noreferrer');
		} else {
			navigate(`/docs/${doc.slug}`);
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div onClick={handleClick} className="block cursor-pointer group relative h-full">
					<DragHandle dragHandleProps={dragHandleProps} variant="grid" />
					<Card className="h-full transition-colors hover:bg-muted/50">
						<CardHeader className="p-6 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3 min-w-0">
									<FileText className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
									<div className="min-w-0">
										<div className="flex items-start gap-2">
											<CardTitle className="text-lg font-semibold leading-tight">
												{doc.title}
											</CardTitle>
											{isUserPinned && (
												<Pin className="h-3 w-3 text-primary shrink-0 mt-1.5" />
											)}
										</div>
									</div>
								</div>
								{isExternal && (
									<ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
								)}
							</div>
							{doc.excerpt && (
								<CardDescription className="line-clamp-2 text-sm">
									{doc.excerpt}
								</CardDescription>
							)}
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								{doc.category_name && (
									<span className="bg-secondary px-2 py-0.5 rounded">
										{doc.category_name}
									</span>
								)}
								{!doc.is_published && (
									<span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
										Draft
									</span>
								)}
							</div>
						</CardHeader>
					</Card>
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
