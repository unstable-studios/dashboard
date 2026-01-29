import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { authFetch } from '@/lib/auth';

interface Version {
	version_number: number;
	title: string;
	created_by: string | null;
	created_at: string;
}

interface VersionContent extends Version {
	content: string | null;
	excerpt: string | null;
}

interface VersionHistoryProps {
	documentSlug: string;
}

export function VersionHistory({ documentSlug }: VersionHistoryProps) {
	const { getAccessTokenSilently } = useAuth0();
	const [expanded, setExpanded] = useState(false);
	const [versions, setVersions] = useState<Version[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<VersionContent | null>(null);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [loadingVersion, setLoadingVersion] = useState(false);

	const fetchVersions = async () => {
		if (versions.length > 0) return; // Already loaded

		setLoading(true);
		setError(null);
		try {
			const res = await authFetch(
				`/api/docs/${documentSlug}/versions`,
				getAccessTokenSilently
			);

			if (!res.ok) {
				throw new Error('Failed to load versions');
			}

			const data = await res.json();
			setVersions(data.versions || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load versions');
		} finally {
			setLoading(false);
		}
	};

	const handleToggle = () => {
		if (!expanded) {
			fetchVersions();
		}
		setExpanded(!expanded);
	};

	const handleViewVersion = async (versionNumber: number) => {
		setLoadingVersion(true);
		try {
			const res = await authFetch(
				`/api/docs/${documentSlug}/versions/${versionNumber}`,
				getAccessTokenSilently
			);

			if (!res.ok) {
				throw new Error('Failed to load version');
			}

			const data = await res.json();
			setSelectedVersion(data.version);
			setViewDialogOpen(true);
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to load version');
		} finally {
			setLoadingVersion(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div className="mt-8 pt-6 border-t">
			<button
				type="button"
				aria-expanded={expanded}
				onClick={handleToggle}
				className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
			>
				<History className="h-4 w-4" />
				Version History
				{expanded ? (
					<ChevronUp className="h-4 w-4 ml-auto" />
				) : (
					<ChevronDown className="h-4 w-4 ml-auto" />
				)}
			</button>

			{expanded && (
				<div className="mt-4">
					{loading && (
						<div className="space-y-2">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="h-12 bg-muted animate-pulse rounded"
								/>
							))}
						</div>
					)}

					{error && (
						<p className="text-sm text-destructive">{error}</p>
					)}

					{!loading && !error && versions.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No previous versions available
						</p>
					)}

					{!loading && versions.length > 0 && (
						<div className="space-y-2">
							{versions.map((version) => (
								<div
									key={version.version_number}
									className="flex items-center justify-between p-3 rounded-lg border bg-card"
								>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">
												Version {version.version_number}
											</span>
											<span className="text-xs text-muted-foreground truncate">
												{version.title}
											</span>
										</div>
										<div className="text-xs text-muted-foreground">
											{version.created_by && `${version.created_by} • `}
											{formatDate(version.created_at)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleViewVersion(version.version_number)}
										disabled={loadingVersion}
									>
										View
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			<Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							Version {selectedVersion?.version_number}
							<span className="text-sm font-normal text-muted-foreground">
								{selectedVersion?.title}
							</span>
						</DialogTitle>
					</DialogHeader>

					{selectedVersion && (
						<div className="space-y-4">
							<div className="text-xs text-muted-foreground">
								{selectedVersion.created_by && (
									<span>Saved by {selectedVersion.created_by} • </span>
								)}
								{formatDate(selectedVersion.created_at)}
							</div>

							<div className="prose prose-neutral dark:prose-invert max-w-none prose-sm">
								<Markdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeSanitize]}
								>
									{selectedVersion.content || '*No content*'}
								</Markdown>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
