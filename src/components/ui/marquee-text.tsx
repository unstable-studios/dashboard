import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTextProps {
	children: string;
	className?: string;
}

// Fixed scroll speed: 40px per second (same for all text)
const SCROLL_SPEED = 40;
// Gap between the original and duplicate text
const GAP = 60;

export function MarqueeText({ children, className }: MarqueeTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLSpanElement>(null);
	const [overflow, setOverflow] = useState({ isOverflowing: false, textWidth: 0 });

	useEffect(() => {
		const checkOverflow = () => {
			if (containerRef.current && measureRef.current) {
				const containerWidth = containerRef.current.offsetWidth;
				const textWidth = measureRef.current.offsetWidth;
				const isOverflowing = textWidth > containerWidth;
				setOverflow({ isOverflowing, textWidth });
			}
		};

		checkOverflow();
		window.addEventListener('resize', checkOverflow);
		return () => window.removeEventListener('resize', checkOverflow);
	}, [children]);

	// Scroll distance = text width + gap (to complete the wrap)
	const scrollDistance = overflow.textWidth + GAP;
	// Duration = distance / speed (simple, consistent speed)
	const scrollDuration = scrollDistance / SCROLL_SPEED;

	return (
		<div
			ref={containerRef}
			className={cn('overflow-hidden whitespace-nowrap', className)}
		>
			{overflow.isOverflowing ? (
				<span
					className="inline-flex animate-marquee"
					style={{
						'--marquee-duration': `${scrollDuration}s`,
						'--marquee-distance': `-${scrollDistance}px`,
					} as React.CSSProperties}
				>
					<span ref={measureRef}>{children}</span>
					<span className="pl-[60px]" aria-hidden="true">
						{children}
					</span>
				</span>
			) : (
				<span ref={measureRef} className="inline-block">
					{children}
				</span>
			)}
		</div>
	);
}
