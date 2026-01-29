import React, { useRef } from 'react';
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
	isDragActiveRef: React.RefObject<boolean>;
}

function SortableItem({ id, children, isDragActiveRef }: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	// Prevent click events when drag is active to avoid navigating after drop
	const handleClick = (e: React.MouseEvent) => {
		if (isDragActiveRef.current) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	return (
		<div ref={setNodeRef} style={style} onClickCapture={handleClick}>
			{children({ listeners, attributes })}
		</div>
	);
}

interface SortableListProps<T extends { id: number }> {
	items: T[];
	onReorder: (orderedIds: number[]) => void;
	renderItem: (item: T, dragHandleProps: DragHandleProps) => React.ReactNode;
	disabled?: boolean;
}

export function SortableList<T extends { id: number }>({
	items,
	onReorder,
	renderItem,
	disabled = false,
}: SortableListProps<T>) {
	const isDragActiveRef = useRef(false);

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
		isDragActiveRef.current = true;
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		// Keep drag active flag briefly to block the click event that fires after drop
		setTimeout(() => {
			isDragActiveRef.current = false;
		}, 0);

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

	if (disabled) {
		return (
			<div className="space-y-2">
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
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-2">
					{items.map((item) => (
						<SortableItem key={item.id} id={item.id} isDragActiveRef={isDragActiveRef}>
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
}

export function DragHandle({ dragHandleProps }: DragHandleButtonProps) {
	if (!dragHandleProps?.listeners || !dragHandleProps?.attributes) {
		return null;
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
