import { useState, useMemo } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Document } from './ReminderDialog';

interface DocumentComboboxProps {
	documents: Document[];
	value: number | '';
	onChange: (value: number | '') => void;
	disabled?: boolean;
}

export function DocumentCombobox({
	documents,
	value,
	onChange,
	disabled,
}: DocumentComboboxProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const selectedDocument = documents.find((doc) => doc.id === value);

	// Group documents by category
	const groupedDocuments = useMemo(() => {
		const filtered = documents.filter((doc) =>
			doc.title.toLowerCase().includes(search.toLowerCase())
		);

		const groups = new Map<string, Document[]>();
		const uncategorized: Document[] = [];

		for (const doc of filtered) {
			if (doc.category_name) {
				const existing = groups.get(doc.category_name) || [];
				existing.push(doc);
				groups.set(doc.category_name, existing);
			} else {
				uncategorized.push(doc);
			}
		}

		// Sort categories alphabetically
		const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
			a[0].localeCompare(b[0])
		);

		return { groups: sortedGroups, uncategorized };
	}, [documents, search]);

	const handleSelect = (docId: number | '') => {
		onChange(docId);
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) setSearch('');
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal h-9"
					disabled={disabled}
				>
					<span className="truncate">
						{selectedDocument ? selectedDocument.title : 'No document'}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0" align="start">
				<div className="p-2 border-b">
					<Input
						placeholder="Search documents..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-8"
					/>
				</div>
				<div className="max-h-[300px] overflow-y-auto">
					{/* No document option */}
					<button
						type="button"
						className={cn(
							'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer',
							value === '' && 'bg-accent'
						)}
						onClick={() => handleSelect('')}
					>
						<Check
							className={cn(
								'h-4 w-4 shrink-0',
								value === '' ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span className="text-muted-foreground italic">No document</span>
					</button>

					{/* Categorized documents */}
					{groupedDocuments.groups.map(([category, docs]) => (
						<div key={category}>
							<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
								{category}
							</div>
							{docs.map((doc) => (
								<button
									type="button"
									key={doc.id}
									className={cn(
										'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer',
										value === doc.id && 'bg-accent'
									)}
									onClick={() => handleSelect(doc.id)}
								>
									<Check
										className={cn(
											'h-4 w-4 shrink-0',
											value === doc.id ? 'opacity-100' : 'opacity-0'
										)}
									/>
									<span className="truncate">{doc.title}</span>
								</button>
							))}
						</div>
					))}

					{/* Uncategorized documents */}
					{groupedDocuments.uncategorized.length > 0 && (
						<div>
							{groupedDocuments.groups.length > 0 && (
								<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
									Uncategorized
								</div>
							)}
							{groupedDocuments.uncategorized.map((doc) => (
								<button
									type="button"
									key={doc.id}
									className={cn(
										'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer',
										value === doc.id && 'bg-accent'
									)}
									onClick={() => handleSelect(doc.id)}
								>
									<Check
										className={cn(
											'h-4 w-4 shrink-0',
											value === doc.id ? 'opacity-100' : 'opacity-0'
										)}
									/>
									<span className="truncate">{doc.title}</span>
								</button>
							))}
						</div>
					)}

					{/* No results */}
					{groupedDocuments.groups.length === 0 &&
						groupedDocuments.uncategorized.length === 0 &&
						search && (
							<div className="px-3 py-6 text-sm text-center text-muted-foreground">
								No documents found
							</div>
						)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
