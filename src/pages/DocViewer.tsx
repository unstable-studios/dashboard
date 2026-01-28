import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/auth';
import { ArrowLeft, Edit, ExternalLink, Trash2, Paperclip } from 'lucide-react';
import { Document } from '@/components/docs/DocCard';
import { AttachmentList, Attachment } from '@/components/docs/AttachmentList';
import { AttachmentUpload } from '@/components/docs/AttachmentUpload';

export function DocViewer() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const { getAccessTokenSilently } = useAuth0();
	const [document, setDocument] = useState<Document | null>(null);
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		async function fetchData() {
			if (!slug) return;

			try {
				const [docRes, meRes] = await Promise.all([
					authFetch(`/api/docs/${slug}`, getAccessTokenSilently),
					authFetch('/api/auth/me', getAccessTokenSilently),
				]);

				if (!docRes.ok) {
					if (docRes.status === 404) {
						setError('Document not found');
					} else {
						throw new Error('Failed to fetch document');
					}
					return;
				}

				const docData = await docRes.json();
				const meData = meRes.ok ? await meRes.json() : { isAdmin: false };

				setDocument(docData.document);
				setIsAdmin(meData.isAdmin || false);

				// Fetch attachments if document has an ID
				if (docData.document?.id) {
					const attachRes = await authFetch(
						`/api/attachments/document/${docData.document.id}`,
						getAccessTokenSilently
					);
					if (attachRes.ok) {
						const attachData = await attachRes.json();
						setAttachments(attachData.attachments || []);
					}
				}
			} catch (err) {
				console.error('Error fetching document:', err);
				setError(err instanceof Error ? err.message : 'Failed to load document');
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [slug, getAccessTokenSilently]);

	const handleDelete = async () => {
		if (!document || !confirm('Are you sure you want to delete this document?')) {
			return;
		}

		setDeleting(true);
		try {
			const res = await authFetch(
				`/api/docs/${document.slug}`,
				getAccessTokenSilently,
				{ method: 'DELETE' }
			);

			if (!res.ok) {
				throw new Error('Failed to delete document');
			}

			navigate('/docs');
		} catch (err) {
			console.error('Error deleting document:', err);
			alert('Failed to delete document');
		} finally {
			setDeleting(false);
		}
	};

	const handleUploadAttachment = async (file: File) => {
		if (!document) return;

		const formData = new FormData();
		formData.append('file', file);

		const res = await authFetch(
			`/api/attachments/document/${document.id}`,
			getAccessTokenSilently,
			{
				method: 'POST',
				body: formData,
			}
		);

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Upload failed');
		}

		const data = await res.json();
		setAttachments((prev) => [data.attachment, ...prev]);
	};

	const handleDownloadAttachment = async (attachment: Attachment) => {
		// Open download in new tab
		const token = await getAccessTokenSilently();
		const res = await fetch(`/api/attachments/${attachment.id}/download`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			alert('Failed to download file');
			return;
		}

		// Create blob and download
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = window.document.createElement('a');
		a.href = url;
		a.download = attachment.original_name;
		window.document.body.appendChild(a);
		a.click();
		window.document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleDeleteAttachment = async (attachment: Attachment) => {
		if (!confirm(`Delete "${attachment.original_name}"?`)) return;

		const res = await authFetch(
			`/api/attachments/${attachment.id}`,
			getAccessTokenSilently,
			{ method: 'DELETE' }
		);

		if (!res.ok) {
			alert('Failed to delete attachment');
			return;
		}

		setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
	};

	if (loading) {
		return (
			<AppShell>
				<div className="space-y-4">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-4 w-96 bg-muted animate-pulse rounded" />
					<div className="space-y-2 mt-8">
						{[...Array(10)].map((_, i) => (
							<div
								key={i}
								className="h-4 bg-muted animate-pulse rounded"
								style={{ width: `${Math.random() * 40 + 60}%` }}
							/>
						))}
					</div>
				</div>
			</AppShell>
		);
	}

	if (error || !document) {
		return (
			<AppShell>
				<div className="text-center py-12">
					<p className="text-destructive mb-4">{error || 'Document not found'}</p>
					<Link to="/docs">
						<Button variant="outline" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
				</div>
			</AppShell>
		);
	}

	// External document - redirect
	if (document.external_url) {
		return (
			<AppShell>
				<div className="text-center py-12 space-y-4">
					<p className="text-muted-foreground">
						This document is hosted externally.
					</p>
					<a
						href={document.external_url}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button className="gap-2">
							<ExternalLink className="h-4 w-4" />
							Open {document.title}
						</Button>
					</a>
					<div>
						<Link to="/docs">
							<Button variant="ghost" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								Back to Documents
							</Button>
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<article className="max-w-4xl">
				{/* Header */}
				<div className="mb-8 space-y-4">
					<Link to="/docs">
						<Button variant="ghost" size="sm" className="gap-2 -ml-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>

					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold">{document.title}</h1>
							{document.category_name && (
								<p className="text-muted-foreground mt-1">
									{document.category_name}
								</p>
							)}
							{!document.is_published && (
								<span className="inline-block mt-2 bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-sm">
									Draft
								</span>
							)}
						</div>

						{isAdmin && (
							<div className="flex gap-2">
								<Link to={`/docs/${document.slug}/edit`}>
									<Button variant="outline" size="sm" className="gap-2">
										<Edit className="h-4 w-4" />
										Edit
									</Button>
								</Link>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 text-destructive hover:text-destructive"
									onClick={handleDelete}
									disabled={deleting}
								>
									<Trash2 className="h-4 w-4" />
									{deleting ? 'Deleting...' : 'Delete'}
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
						{document.content || '*No content*'}
					</Markdown>
				</div>

				{/* Attachments */}
				{(attachments.length > 0 || isAdmin) && (
					<div className="mt-8 pt-6 border-t space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Paperclip className="h-4 w-4" />
							Attachments
						</div>

						<AttachmentList
							attachments={attachments}
							isAdmin={isAdmin}
							onDownload={handleDownloadAttachment}
							onDelete={isAdmin ? handleDeleteAttachment : undefined}
						/>

						{isAdmin && (
							<AttachmentUpload onUpload={handleUploadAttachment} />
						)}
					</div>
				)}

				{/* Footer */}
				<div className="mt-12 pt-4 border-t text-sm text-muted-foreground">
					{document.updated_by && (
						<p>Last updated by {document.updated_by}</p>
					)}
					<p>
						Updated{' '}
						{new Date(document.updated_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})}
					</p>
				</div>
			</article>
		</AppShell>
	);
}
