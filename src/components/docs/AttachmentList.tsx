import { FileText, Download, Trash2, File, Image, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Attachment {
	id: number;
	document_id: number;
	filename: string;
	original_name: string;
	content_type: string;
	size_bytes: number;
	uploaded_by: string | null;
	created_at: string;
}

interface AttachmentListProps {
	attachments: Attachment[];
	onDownload: (attachment: Attachment) => void;
	onDelete?: (attachment: Attachment) => void;
}

function getFileIcon(contentType: string) {
	if (contentType.startsWith('image/')) {
		return <Image className="h-4 w-4" />;
	}
	if (contentType === 'application/pdf') {
		return <FileText className="h-4 w-4 text-red-500" />;
	}
	if (
		contentType.includes('spreadsheet') ||
		contentType.includes('excel') ||
		contentType === 'text/csv'
	) {
		return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
	}
	if (contentType.includes('word') || contentType.includes('document')) {
		return <FileText className="h-4 w-4 text-blue-500" />;
	}
	return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
	attachments,
	onDownload,
	onDelete,
}: AttachmentListProps) {
	if (attachments.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">Attachments</h3>
			<div className="space-y-1">
				{attachments.map((attachment) => (
					<div
						key={attachment.id}
						className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
					>
						<div className="flex items-center gap-2 min-w-0">
							{getFileIcon(attachment.content_type)}
							<div className="min-w-0">
								<p className="text-sm font-medium truncate">
									{attachment.original_name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(attachment.size_bytes)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1 shrink-0">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => onDownload(attachment)}
								title="Download"
							>
								<Download className="h-4 w-4" />
							</Button>
							{onDelete && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() => onDelete(attachment)}
									title="Delete"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
