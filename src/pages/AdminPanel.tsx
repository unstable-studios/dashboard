import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LinkDialog } from '@/components/links/LinkDialog';
import { CategoryDialog, Category } from '@/components/admin/CategoryDialog';
import { ServiceLink } from '@/components/links/LinkCard';
import { Document } from '@/components/docs/DocCard';
import { authFetch } from '@/lib/auth';
import {
	Shield,
	Link as LinkIcon,
	FileText,
	Tag,
	ExternalLink,
	Plus,
	Pencil,
	Trash2,
	LayoutDashboard
} from 'lucide-react';

interface Stats {
	links: number;
	documents: number;
	categories: number;
}

export function AdminPanel() {
	const { getAccessTokenSilently } = useAuth0();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<Stats>({ links: 0, documents: 0, categories: 0 });
	const [isAdmin, setIsAdmin] = useState(false);
	const [userEmail, setUserEmail] = useState('');

	// Entity data
	const [links, setLinks] = useState<ServiceLink[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);

	// Dialog state
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<ServiceLink | null>(null);
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const fetchData = async () => {
		try {
			const [meRes, linksRes, docsRes, catsRes] = await Promise.all([
				authFetch('/api/auth/me', getAccessTokenSilently),
				authFetch('/api/links', getAccessTokenSilently),
				authFetch('/api/docs?include_unpublished=true', getAccessTokenSilently),
				authFetch('/api/categories', getAccessTokenSilently),
			]);

			if (!meRes.ok) {
				throw new Error('Not authorized');
			}

			const meData = await meRes.json();
			setIsAdmin(meData.isAdmin);
			setUserEmail(meData.email);

			if (!meData.isAdmin) {
				setError('You do not have admin access');
				setLoading(false);
				return;
			}

			// Get data
			const [linksData, docsData, catsData] = await Promise.all([
				linksRes.ok ? linksRes.json() : { links: [] },
				docsRes.ok ? docsRes.json() : { documents: [] },
				catsRes.ok ? catsRes.json() : { categories: [] },
			]);

			setLinks(linksData.links || []);
			setDocuments(docsData.documents || []);
			setCategories(catsData.categories || []);

			setStats({
				links: linksData.links?.length || 0,
				documents: docsData.documents?.length || 0,
				categories: catsData.categories?.length || 0,
			});
		} catch (err) {
			console.error('Error fetching admin data:', err);
			setError(err instanceof Error ? err.message : 'Failed to load data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [getAccessTokenSilently]);

	// Link handlers
	const handleAddLink = () => {
		setEditingLink(null);
		setLinkDialogOpen(true);
	};

	const handleEditLink = (link: ServiceLink) => {
		setEditingLink(link);
		setLinkDialogOpen(true);
	};

	const handleDeleteLink = async (link: ServiceLink) => {
		if (!confirm(`Delete "${link.title}"?`)) return;

		try {
			const res = await authFetch(`/api/links/${link.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) throw new Error('Failed to delete');
			fetchData();
		} catch (err) {
			console.error('Error deleting link:', err);
			alert('Failed to delete link');
		}
	};

	// Document handlers
	const handleAddDoc = () => {
		navigate('/docs/new');
	};

	const handleEditDoc = (doc: Document) => {
		navigate(`/docs/${doc.slug}/edit`);
	};

	const handleDeleteDoc = async (doc: Document) => {
		if (!confirm(`Delete "${doc.title}"?`)) return;

		try {
			const res = await authFetch(`/api/docs/${doc.slug}`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) throw new Error('Failed to delete');
			fetchData();
		} catch (err) {
			console.error('Error deleting document:', err);
			alert('Failed to delete document');
		}
	};

	// Category handlers
	const handleAddCategory = () => {
		setEditingCategory(null);
		setCategoryDialogOpen(true);
	};

	const handleEditCategory = (category: Category) => {
		setEditingCategory(category);
		setCategoryDialogOpen(true);
	};

	const handleDeleteCategory = async (category: Category) => {
		if (!confirm(`Delete category "${category.name}"? This will NOT delete associated links/documents.`)) return;

		try {
			const res = await authFetch(`/api/categories/${category.id}`, getAccessTokenSilently, {
				method: 'DELETE',
			});
			if (!res.ok) throw new Error('Failed to delete');
			fetchData();
		} catch (err) {
			console.error('Error deleting category:', err);
			alert('Failed to delete category');
		}
	};

	if (loading) {
		return (
			<AppShell>
				<div className="space-y-6">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
						))}
					</div>
				</div>
			</AppShell>
		);
	}

	if (!isAdmin) {
		return (
			<AppShell>
				<div className="text-center py-12">
					<Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h1 className="text-2xl font-bold mb-2">Access Denied</h1>
					<p className="text-muted-foreground">
						You do not have admin access to this page.
					</p>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell>
			<div className="space-y-8">
				<div>
					<h1 className="text-2xl font-bold">Admin Panel</h1>
					<p className="text-muted-foreground">Manage links, documents, and categories</p>
				</div>

				{error && (
					<div className="bg-destructive/10 text-destructive px-4 py-2 rounded">
						{error}
					</div>
				)}

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Overview</CardTitle>
							<LayoutDashboard className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">
								Logged in as <strong>{userEmail}</strong>
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Links</CardTitle>
							<LinkIcon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.links}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Documents</CardTitle>
							<FileText className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.documents}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Categories</CardTitle>
							<Tag className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.categories}</div>
						</CardContent>
					</Card>
				</div>

				{/* Entity Management Tabs */}
				<Tabs defaultValue="links" className="space-y-4">
					<TabsList>
						<TabsTrigger value="links" className="gap-2">
							<LinkIcon className="h-4 w-4" />
							Links
						</TabsTrigger>
						<TabsTrigger value="documents" className="gap-2">
							<FileText className="h-4 w-4" />
							Documents
						</TabsTrigger>
						<TabsTrigger value="categories" className="gap-2">
							<Tag className="h-4 w-4" />
							Categories
						</TabsTrigger>
						<TabsTrigger value="settings" className="gap-2">
							<Shield className="h-4 w-4" />
							Settings
						</TabsTrigger>
					</TabsList>

					{/* Links Tab */}
					<TabsContent value="links">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Service Links</CardTitle>
									<CardDescription>Manage service links and bookmarks</CardDescription>
								</div>
								<Button onClick={handleAddLink} className="gap-2">
									<Plus className="h-4 w-4" />
									Add Link
								</Button>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">Icon</TableHead>
											<TableHead>Title</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Pinned</TableHead>
											<TableHead className="w-24">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{links.map((link) => (
											<TableRow key={link.id}>
												<TableCell className="text-xl">{link.icon || '🔗'}</TableCell>
												<TableCell>
													<div className="font-medium">{link.title}</div>
													<div className="text-xs text-muted-foreground truncate max-w-xs">
														{link.url}
													</div>
												</TableCell>
												<TableCell>
													{link.category_name || <span className="text-muted-foreground">—</span>}
												</TableCell>
												<TableCell>
													{link.is_pinned ? 'Yes' : 'No'}
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleEditLink(link)}
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDeleteLink(link)}
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
										{links.length === 0 && (
											<TableRow>
												<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
													No links yet. Add your first link to get started.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Documents Tab */}
					<TabsContent value="documents">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Documents</CardTitle>
									<CardDescription>Manage documentation and guides</CardDescription>
								</div>
								<Button onClick={handleAddDoc} className="gap-2">
									<Plus className="h-4 w-4" />
									New Document
								</Button>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Title</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="w-24">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{documents.map((doc) => (
											<TableRow key={doc.id}>
												<TableCell>
													<div className="font-medium">{doc.title}</div>
													<div className="text-xs text-muted-foreground">
														/{doc.slug}
													</div>
												</TableCell>
												<TableCell>
													{doc.category_name || <span className="text-muted-foreground">—</span>}
												</TableCell>
												<TableCell>
													{doc.external_url ? (
														<span className="flex items-center gap-1 text-xs">
															<ExternalLink className="h-3 w-3" />
															External
														</span>
													) : (
														'Internal'
													)}
												</TableCell>
												<TableCell>
													{doc.is_published ? (
														<span className="text-green-600">Published</span>
													) : (
														<span className="text-yellow-600">Draft</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleEditDoc(doc)}
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDeleteDoc(doc)}
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
										{documents.length === 0 && (
											<TableRow>
												<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
													No documents yet. Create your first document to get started.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Categories Tab */}
					<TabsContent value="categories">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Categories</CardTitle>
									<CardDescription>Organize links and documents into categories</CardDescription>
								</div>
								<Button onClick={handleAddCategory} className="gap-2">
									<Plus className="h-4 w-4" />
									Add Category
								</Button>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">Icon</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Slug</TableHead>
											<TableHead className="w-24">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{categories.map((category) => (
											<TableRow key={category.id}>
												<TableCell className="text-xl">{category.icon || '📁'}</TableCell>
												<TableCell className="font-medium">{category.name}</TableCell>
												<TableCell className="text-muted-foreground">{category.slug}</TableCell>
												<TableCell>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleEditCategory(category)}
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDeleteCategory(category)}
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
										{categories.length === 0 && (
											<TableRow>
												<TableCell colSpan={4} className="text-center text-muted-foreground py-8">
													No categories yet. Add a category to organize your content.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Settings Tab */}
					<TabsContent value="settings">
						<Card>
							<CardHeader>
								<CardTitle>Admin Access</CardTitle>
								<CardDescription>
									Admin roles are managed via Auth0 RBAC.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm text-muted-foreground">
									You are logged in as <strong>{userEmail}</strong> with admin permissions.
								</p>
								<p className="text-sm text-muted-foreground">
									To manage admin access, assign the <code className="bg-muted px-1 rounded">admin</code> permission
									to users via Auth0 Dashboard.
								</p>
								<a
									href="https://manage.auth0.com/"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
								>
									Open Auth0 Dashboard
									<ExternalLink className="h-3 w-3" />
								</a>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			{/* Dialogs */}
			<LinkDialog
				open={linkDialogOpen}
				onOpenChange={setLinkDialogOpen}
				link={editingLink}
				categories={categories}
				onSaved={fetchData}
			/>

			<CategoryDialog
				open={categoryDialogOpen}
				onOpenChange={setCategoryDialogOpen}
				category={editingCategory}
				onSaved={fetchData}
			/>
		</AppShell>
	);
}
