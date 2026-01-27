import { useState } from 'react';
import { Button } from './button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from './popover';

// Common emojis organized by category
const EMOJI_CATEGORIES = {
	'Business': ['📊', '📈', '📉', '💼', '📁', '📋', '📝', '✏️', '📌', '📎'],
	'Communication': ['📧', '📬', '💬', '🗣️', '📞', '☎️', '📱', '💻', '🖥️', '⌨️'],
	'Tools': ['🔧', '🔨', '⚙️', '🔩', '🛠️', '🔬', '🔭', '📷', '🎬', '🎨'],
	'Status': ['✅', '❌', '⚠️', '🔔', '🔕', '🔴', '🟢', '🟡', '🔵', '⭐'],
	'Symbols': ['🔗', '🔒', '🔓', '🔑', '🏠', '🏢', '🌐', '☁️', '⚡', '🚀'],
	'Finance': ['💰', '💵', '💳', '🏦', '📊', '🧾', '📑', '💹', '📆', '⏰'],
	'People': ['👤', '👥', '🧑‍💼', '👨‍💻', '👩‍💻', '🤝', '👋', '✋', '👍', '👎'],
	'Files': ['📄', '📃', '📑', '📂', '🗂️', '📚', '📖', '📰', '🗞️', '📓'],
};

interface EmojiPickerProps {
	value: string;
	onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState<string>('Business');

	const handleSelect = (emoji: string) => {
		onChange(emoji);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					type="button"
					className="w-full justify-start font-normal"
				>
					{value ? (
						<span className="text-xl">{value}</span>
					) : (
						<span className="text-muted-foreground">Select icon...</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-2" align="start">
				<div className="flex gap-1 flex-wrap mb-2 pb-2 border-b">
					{Object.keys(EMOJI_CATEGORIES).map((category) => (
						<Button
							key={category}
							variant={activeCategory === category ? 'secondary' : 'ghost'}
							size="sm"
							className="text-xs px-2 py-1 h-auto"
							onClick={() => setActiveCategory(category)}
						>
							{category}
						</Button>
					))}
				</div>
				<div className="grid grid-cols-10 gap-1">
					{EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
						<Button
							key={emoji}
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 text-lg hover:bg-muted"
							onClick={() => handleSelect(emoji)}
						>
							{emoji}
						</Button>
					))}
				</div>
				{value && (
					<div className="mt-2 pt-2 border-t">
						<Button
							variant="ghost"
							size="sm"
							className="w-full text-muted-foreground"
							onClick={() => handleSelect('')}
						>
							Clear icon
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
