import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentUploadProps {
	onUpload: (file: File) => Promise<void>;
	disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [
	'.pdf',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.txt',
	'.csv',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
];

export function AttachmentUpload({ onUpload, disabled }: AttachmentUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): string | null => {
		if (file.size > MAX_FILE_SIZE) {
			return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
		}

		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		if (!ALLOWED_EXTENSIONS.includes(extension)) {
			return `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
		}

		return null;
	};

	const handleFile = async (file: File) => {
		setError(null);

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setUploading(true);
		try {
			await onUpload(file);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			handleFile(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleClick = () => {
		inputRef.current?.click();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFile(file);
		}
		// Reset input so same file can be selected again
		e.target.value = '';
	};

	return (
		<div className="space-y-2">
			<div
				className={`
					relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
					transition-colors
					${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
					${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
				`}
				onDrop={!disabled && !uploading ? handleDrop : undefined}
				onDragOver={!disabled && !uploading ? handleDragOver : undefined}
				onDragLeave={handleDragLeave}
				onClick={!disabled && !uploading ? handleClick : undefined}
			>
				<input
					ref={inputRef}
					type="file"
					className="hidden"
					accept={ALLOWED_EXTENSIONS.join(',')}
					onChange={handleInputChange}
					disabled={disabled || uploading}
				/>

				{uploading ? (
					<div className="flex flex-col items-center gap-2 py-2">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Uploading...</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 py-2">
						<Upload className="h-6 w-6 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">
								Drop file here or click to upload
							</p>
							<p className="text-xs text-muted-foreground">
								PDF, images, Office docs (max 10MB)
							</p>
						</div>
					</div>
				)}
			</div>

			{error && (
				<div className="flex items-center gap-2 text-sm text-destructive">
					<X className="h-4 w-4" />
					{error}
					<Button
						variant="ghost"
						size="sm"
						className="h-auto p-0 text-destructive hover:text-destructive"
						onClick={() => setError(null)}
					>
						Dismiss
					</Button>
				</div>
			)}
		</div>
	);
}
