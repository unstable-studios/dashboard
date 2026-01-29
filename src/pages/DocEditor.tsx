import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch } from '@/lib/auth';
import { ArrowLeft, Eye, Save } from 'lucide-react';

const LIMITS = { title: 100, excerpt: 500 } as const;

interface Category {
	id: number;
	name: string;
	slug: string;
}

export function DocEditor() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const { getAccessTokenSilently } = useAuth0();

	const isNew = !slug;

	const [title, setTitle] = useState('');
	const [docSlug, setDocSlug] = useState('');
	const [content, setContent] = useState('');
	const [excerpt, setExcerpt] = useState('');
	const [categoryId, setCategoryId] = useState<number | ''>('');
	const [externalUrl, setExternalUrl] = useState('');
	const [isPublished, setIsPublished] = useState(true);

	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);

	useEffect(() => {
		async function fetchData() {
			try {
				const categoriesRes = await authFetch(
					'/api/categories',
					getAccessTokenSilently
				);
				if (categoriesRes.ok) {
					const data = await categoriesRes.json();
					setCategories(data.categories);
				}

				if (slug) {
					const docRes = await authFetch(
						`/api/docs/${slug}`,
						getAccessTokenSilently
					);
					if (!docRes.ok) {
						setError('Document not found');
						return;
					}
					const docData = await docRes.json();
					const doc = docData.document;
					setTitle(doc.title);
					setDocSlug(doc.slug);
					setContent(doc.content || '');
					setExcerpt(doc.excerpt || '');
					setCategoryId(doc.category_id || '');
					setExternalUrl(doc.external_url || '');
					setIsPublished(!!doc.is_published);
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Failed to load data');
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [slug, getAccessTokenSilently]);

	// Auto-generate slug from title for new documents
	useEffect(() => {
		if (isNew && title) {
			const generated = title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
			setDocSlug(generated);
		}
	}, [title, isNew]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		try {
			const body = {
				title,
				slug: docSlug,
				content: content || null,
				excerpt: excerpt || null,
				category_id: categoryId || null,
				external_url: externalUrl || null,
				external_type: externalUrl ? 'link' : null,
				is_published: isPublished,
			};

			const res = await authFetch(
				isNew ? '/api/docs' : `/api/docs/${slug}`,
				getAccessTokenSilently,
				{
					method: isNew ? 'POST' : 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save document');
			}

			navigate(`/docs/${docSlug}`);
		} catch (err) {
			console.error('Error saving document:', err);
			setError(err instanceof Error ? err.message : 'Failed to save document');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<AppShell>
				<div className="space-y-4 max-w-4xl mx-auto">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-10 bg-muted animate-pulse rounded" />
					<div className="h-64 bg-muted animate-pulse rounded" />
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<Link to="/docs">
						<Button variant="ghost" size="sm" className="gap-2 -ml-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
					<h1 className="text-2xl font-bold mt-2">
						{isNew ? 'New Document' : 'Edit Document'}
					</h1>
				</div>

				{error && (
					<div className="bg-destructive/10 text-destructive px-4 py-2 rounded mb-6">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value.slice(0, LIMITS.title))}
								placeholder="Document title"
								maxLength={LIMITS.title}
								required
							/>
							<div className={`text-xs text-right ${title.length >= LIMITS.title ? 'text-destructive' : title.length >= LIMITS.title * 0.8 ? 'text-amber-600' : 'text-muted-foreground'}`}>
								{title.length}/{LIMITS.title}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug</Label>
							<Input
								id="slug"
								value={docSlug}
								onChange={(e) => setDocSlug(e.target.value)}
								placeholder="document-slug"
								pattern="[a-z0-9-]+"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<select
								id="category"
								value={categoryId}
								onChange={(e) =>
									setCategoryId(e.target.value ? Number(e.target.value) : '')
								}
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
							>
								<option value="">No category</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="external">External URL (optional)</Label>
							<Input
								id="external"
								type="url"
								value={externalUrl}
								onChange={(e) => setExternalUrl(e.target.value)}
								placeholder="https://..."
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="excerpt">Excerpt</Label>
						<Input
							id="excerpt"
							value={excerpt}
							onChange={(e) => setExcerpt(e.target.value.slice(0, LIMITS.excerpt))}
							placeholder="Brief description for listings"
							maxLength={LIMITS.excerpt}
						/>
						<div className={`text-xs text-right ${excerpt.length >= LIMITS.excerpt ? 'text-destructive' : excerpt.length >= LIMITS.excerpt * 0.8 ? 'text-amber-600' : 'text-muted-foreground'}`}>
							{excerpt.length}/{LIMITS.excerpt}
						</div>
					</div>

					{!externalUrl && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="content">Content (Markdown)</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowPreview(!showPreview)}
									className="gap-2"
								>
									<Eye className="h-4 w-4" />
									{showPreview ? 'Edit' : 'Preview'}
								</Button>
							</div>
							{showPreview ? (
								<div className="min-h-64 p-4 border rounded-md prose prose-neutral dark:prose-invert max-w-none">
									<Markdown
										remarkPlugins={[remarkGfm]}
										rehypePlugins={[rehypeSanitize]}
									>
										{content || '*No content*'}
									</Markdown>
								</div>
							) : (
								<textarea
									id="content"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="Write your document content in markdown..."
									className="w-full min-h-64 p-4 rounded-md border border-input bg-transparent text-sm font-mono resize-y"
								/>
							)}
						</div>
					)}

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="published"
							checked={isPublished}
							onChange={(e) => setIsPublished(e.target.checked)}
							className="rounded border-input"
						/>
						<Label htmlFor="published" className="font-normal">
							Published
						</Label>
					</div>

					<div className="flex gap-4">
						<Button type="submit" disabled={saving} className="gap-2">
							<Save className="h-4 w-4" />
							{saving ? 'Saving...' : 'Save Document'}
						</Button>
						<Link to="/docs">
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</Link>
					</div>
				</form>
			</div>
		</AppShell>
	);
}
