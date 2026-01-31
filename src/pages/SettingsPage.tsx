import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Moon, Sun, Plus, Pencil, Trash2, ExternalLink, FileText } from 'lucide-react';
import { Theme, applyTheme, getStoredTheme } from '@/lib/theme';
import { authFetch } from '@/lib/auth';
import { LinkDialog } from '@/components/links/LinkDialog';
import { CategoryDialog, Category } from '@/components/admin/CategoryDialog';
import { ServiceLink } from '@/components/links/LinkCard';
import { Document } from '@/components/docs/DocCard';

export function SettingsPage() {
	const { user, getAccessTokenSilently } = useAuth0();
	const [theme, setTheme] = useState<Theme>(getStoredTheme);

	// Links state
	const [links, setLinks] = useState<ServiceLink[]>([]);
	const [linksLoading, setLinksLoading] = useState(true);
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<ServiceLink | null>(null);

	// Categories state
	const [categories, setCategories] = useState<Category[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(true);
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	// Documents state
	const [documents, setDocuments] = useState<Document[]>([]);
	const [documentsLoading, setDocumentsLoading] = useState(true);

	useEffect(() => {
		applyTheme(theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	// Listen for system theme changes when using 'system' theme
	useEffect(() => {
		if (theme !== 'system') return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => applyTheme('system');
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	}, [theme]);

	// Fetch data
	useEffect(() => {
		const fetchLinks = async () => {
			try {
				const res = await authFetch('/api/links', getAccessTokenSilently);
				if (res.ok) {
					const data = await res.json();
					setLinks(data.links);
				}
			} catch (err) {
				console.error('Error fetching links:', err);
			} finally {
				setLinksLoading(false);
			}
		};

		const fetchCategories = async () => {
			try {
				const res = await authFetch('/api/categories', getAccessTokenSilently);
				if (res.ok) {
					const data = await res.json();
					setCategories(data.categories);
				}
			} catch (err) {
				console.error('Error fetching categories:', err);
			} finally {
				setCategoriesLoading(false);
			}
		};

		const fetchDocuments = async () => {
			try {
				const res = await authFetch('/api/docs', getAccessTokenSilently);
				if (res.ok) {
					const data = await res.json();
					setDocuments(data.documents);
				}
			} catch (err) {
				console.error('Error fetching documents:', err);
			} finally {
				setDocumentsLoading(false);
			}
		};

		fetchLinks();
		fetchCategories();
		fetchDocuments();
	}, [getAccessTokenSilently]);

	const handleLinkSaved = async () => {
		const res = await authFetch('/api/links', getAccessTokenSilently);
		if (res.ok) {
			const data = await res.json();
			setLinks(data.links);
		}
	};

	const handleCategorySaved = async () => {
		const res = await authFetch('/api/categories', getAccessTokenSilently);
		if (res.ok) {
			const data = await res.json();
			setCategories(data.categories);
		}
	};

	const handleDeleteLink = async (link: ServiceLink) => {
		if (!confirm(`Are you sure you want to delete "${link.title}"?`)) return;

		try {
			const res = await authFetch(`/api/links/${link.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (res.ok) {
				setLinks(links.filter((l) => l.id !== link.id));
			}
		} catch (err) {
			console.error('Error deleting link:', err);
		}
	};

	const handleDeleteCategory = async (category: Category) => {
		if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

		try {
			const res = await authFetch(`/api/categories/${category.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (res.ok) {
				setCategories(categories.filter((c) => c.id !== category.id));
			}
		} catch (err) {
			console.error('Error deleting category:', err);
		}
	};

	const handleDeleteDocument = async (doc: Document) => {
		if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

		try {
			const res = await authFetch(`/api/docs/${doc.slug}`, getAccessTokenSilently, {
				method: 'DELETE',
			});

			if (res.ok) {
				setDocuments(documents.filter((d) => d.id !== doc.id));
			}
		} catch (err) {
			console.error('Error deleting document:', err);
		}
	};

	const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor },
	];

	return (
		<AppShell>
			<div className="space-y-6 max-w-4xl">
				<div>
					<h1 className="text-2xl font-bold">Settings</h1>
					<p className="text-muted-foreground">Manage your preferences and content</p>
				</div>

				<Tabs defaultValue="profile" className="w-full">
					<TabsList className="grid w-full grid-cols-5">
						<TabsTrigger value="profile">Profile</TabsTrigger>
						<TabsTrigger value="appearance">Appearance</TabsTrigger>
						<TabsTrigger value="links">Links</TabsTrigger>
						<TabsTrigger value="categories">Categories</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
					</TabsList>

					<TabsContent value="profile" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle>Profile</CardTitle>
								<CardDescription>Your account information</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-4">
									{user?.picture && (
										<img
											src={user.picture}
											alt={user.name || 'Profile'}
											className="h-16 w-16 rounded-full"
										/>
									)}
									<div>
										<p className="font-medium">{user?.name}</p>
										<p className="text-sm text-muted-foreground">{user?.email}</p>
									</div>
								</div>
								{user?.sub && (
									<p className="text-xs text-muted-foreground/60 font-mono pt-2 border-t">
										{user.sub}
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="appearance" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle>Appearance</CardTitle>
								<CardDescription>Customize how the app looks</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Theme</Label>
									<div className="flex gap-2">
										{themeOptions.map((option) => {
											const Icon = option.icon;
											return (
												<Button
													key={option.value}
													variant={theme === option.value ? 'secondary' : 'outline'}
													onClick={() => setTheme(option.value)}
													className="gap-2"
												>
													<Icon className="h-4 w-4" />
													{option.label}
												</Button>
											);
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="links" className="mt-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Links</CardTitle>
									<CardDescription>Manage your service links and bookmarks</CardDescription>
								</div>
								<Button
									onClick={() => {
										setEditingLink(null);
										setLinkDialogOpen(true);
									}}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									Add Link
								</Button>
							</CardHeader>
							<CardContent>
								{linksLoading ? (
									<div className="space-y-2">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="h-12 bg-muted animate-pulse rounded" />
										))}
									</div>
								) : links.length === 0 ? (
									<p className="text-muted-foreground text-center py-8">
										No links yet. Add your first link to get started.
									</p>
								) : (
									<div className="space-y-2">
										{links.map((link) => (
											<div
												key={link.id}
												className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center gap-3 min-w-0">
													<span className="text-xl flex-shrink-0">{link.icon || '🔗'}</span>
													<div className="min-w-0">
														<p className="font-medium truncate">{link.title}</p>
														<p className="text-xs text-muted-foreground truncate">{link.url}</p>
													</div>
												</div>
												<div className="flex items-center gap-1 flex-shrink-0">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => window.open(link.url, '_blank')}
														title="Open link"
													>
														<ExternalLink className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => {
															setEditingLink(link);
															setLinkDialogOpen(true);
														}}
														title="Edit"
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => handleDeleteLink(link)}
														title="Delete"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="categories" className="mt-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Categories</CardTitle>
									<CardDescription>Organize your links and documents</CardDescription>
								</div>
								<Button
									onClick={() => {
										setEditingCategory(null);
										setCategoryDialogOpen(true);
									}}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									Add Category
								</Button>
							</CardHeader>
							<CardContent>
								{categoriesLoading ? (
									<div className="space-y-2">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="h-12 bg-muted animate-pulse rounded" />
										))}
									</div>
								) : categories.length === 0 ? (
									<p className="text-muted-foreground text-center py-8">
										No categories yet. Add your first category to organize content.
									</p>
								) : (
									<div className="space-y-2">
										{categories.map((category) => (
											<div
												key={category.id}
												className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center gap-3">
													<span className="text-xl">{category.icon || '📁'}</span>
													<div>
														<p className="font-medium">{category.name}</p>
														<p className="text-xs text-muted-foreground">{category.slug}</p>
													</div>
												</div>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => {
															setEditingCategory(category);
															setCategoryDialogOpen(true);
														}}
														title="Edit"
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => handleDeleteCategory(category)}
														title="Delete"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="documents" className="mt-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Documents</CardTitle>
									<CardDescription>Manage your documentation and notes</CardDescription>
								</div>
								<Link to="/docs/new">
									<Button className="gap-2">
										<Plus className="h-4 w-4" />
										New Document
									</Button>
								</Link>
							</CardHeader>
							<CardContent>
								{documentsLoading ? (
									<div className="space-y-2">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="h-12 bg-muted animate-pulse rounded" />
										))}
									</div>
								) : documents.length === 0 ? (
									<p className="text-muted-foreground text-center py-8">
										No documents yet. Create your first document to get started.
									</p>
								) : (
									<div className="space-y-2">
										{documents.map((doc) => (
											<div
												key={doc.id}
												className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center gap-3 min-w-0">
													<FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<p className="font-medium truncate">{doc.title}</p>
															{!doc.is_published && (
																<span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
																	Draft
																</span>
															)}
														</div>
														{doc.excerpt && (
															<p className="text-xs text-muted-foreground truncate">
																{doc.excerpt}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 flex-shrink-0">
													{doc.external_url ? (
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => window.open(doc.external_url!, '_blank')}
															title="Open external link"
														>
															<ExternalLink className="h-4 w-4" />
														</Button>
													) : (
														<Link to={`/docs/${doc.slug}`}>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																title="View document"
															>
																<ExternalLink className="h-4 w-4" />
															</Button>
														</Link>
													)}
													<Link to={`/docs/${doc.slug}/edit`}>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															title="Edit"
														>
															<Pencil className="h-4 w-4" />
														</Button>
													</Link>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => handleDeleteDocument(doc)}
														title="Delete"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<LinkDialog
				open={linkDialogOpen}
				onOpenChange={setLinkDialogOpen}
				link={editingLink}
				categories={categories}
				onSaved={handleLinkSaved}
			/>

			<CategoryDialog
				open={categoryDialogOpen}
				onOpenChange={setCategoryDialogOpen}
				category={editingCategory}
				onSaved={handleCategorySaved}
			/>
		</AppShell>
	);
}
