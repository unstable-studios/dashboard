import React, { useState } from 'react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
	rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface DragHandleProps {
	listeners?: ReturnType<typeof useSortable>['listeners'];
	attributes?: ReturnType<typeof useSortable>['attributes'];
}

interface SortableItemProps {
	id: number;
	children: (dragHandleProps: DragHandleProps) => React.ReactNode;
	isAnyDragging: boolean;
}

function SortableItem({ id, children, isAnyDragging }: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`h-full ${isAnyDragging ? '[&_a]:pointer-events-none' : ''}`}
		>
			{children({ listeners, attributes })}
		</div>
	);
}

interface SortableListProps<T extends { id: number }> {
	items: T[];
	onReorder: (orderedIds: number[]) => void;
	renderItem: (item: T, dragHandleProps: DragHandleProps) => React.ReactNode;
	disabled?: boolean;
	layout?: 'list' | 'grid' | 'bar';
	className?: string;
}

export function SortableList<T extends { id: number }>({
	items,
	onReorder,
	renderItem,
	disabled = false,
	layout = 'list',
	className,
}: SortableListProps<T>) {
	const [isDragging, setIsDragging] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragStart = () => {
		setIsDragging(true);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		// Delay resetting drag state to ensure pointer-events:none blocks the click
		setTimeout(() => {
			setIsDragging(false);
		}, 50);

		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((item) => item.id === active.id);
			const newIndex = items.findIndex((item) => item.id === over.id);

			if (oldIndex === -1 || newIndex === -1) {
				return;
			}

			const newItems = arrayMove(items, oldIndex, newIndex);
			onReorder(newItems.map((item) => item.id));
		}
	};

	const defaultClassName = layout === 'grid'
		? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
		: layout === 'bar'
		? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2'
		: 'space-y-2';

	const containerClassName = className || defaultClassName;
	const strategy = layout === 'list' ? verticalListSortingStrategy : rectSortingStrategy;

	if (disabled) {
		return (
			<div className={containerClassName}>
				{items.map((item) => (
					<React.Fragment key={item.id}>
						{renderItem(item, {})}
					</React.Fragment>
				))}
			</div>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={items.map((item) => item.id)}
				strategy={strategy}
			>
				<div className={containerClassName}>
					{items.map((item) => (
						<SortableItem key={item.id} id={item.id} isAnyDragging={isDragging}>
							{(dragHandleProps) => renderItem(item, dragHandleProps)}
						</SortableItem>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

interface DragHandleButtonProps {
	dragHandleProps?: DragHandleProps;
	variant?: 'list' | 'grid';
}

export function DragHandle({ dragHandleProps, variant = 'list' }: DragHandleButtonProps) {
	if (!dragHandleProps?.listeners || !dragHandleProps?.attributes) {
		return null;
	}

	if (variant === 'grid') {
		return (
			<button
				type="button"
				aria-label="Drag to reorder"
				className="absolute top-2 right-2 cursor-grab touch-none p-1.5 rounded-md bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-background active:cursor-grabbing transition-opacity z-10"
				{...dragHandleProps.attributes}
				{...dragHandleProps.listeners}
			>
				<GripVertical className="h-4 w-4" />
			</button>
		);
	}

	return (
		<button
			type="button"
			aria-label="Drag to reorder"
			className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
			{...dragHandleProps.attributes}
			{...dragHandleProps.listeners}
		>
			<GripVertical className="h-4 w-4" />
		</button>
	);
}
