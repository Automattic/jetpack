/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export interface WidgetCardProps {
	/** Card height, which is what each skeleton story varies. */
	height: string;
	/** Card width; the dashboard's common tile width unless a story needs another. */
	width?: string;
	children: ReactNode;
}

/**
 * Widget card wrapper for skeleton stories, simulating a dashboard widget
 * container so a shape is shown within typical widget dimensions.
 *
 * @param props          - Component props.
 * @param props.height   - Card height.
 * @param props.width    - Card width.
 * @param props.children - The shape to frame.
 * @return The rendered card.
 */
export function WidgetCard( { height, width = '360px', children }: WidgetCardProps ) {
	return (
		<div
			style={ {
				width,
				height,
				border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
				borderRadius: 'var(--wpds-border-radius-md)',
				background: 'var(--wpds-color-background-surface-neutral)',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			} }
		>
			<div style={ { position: 'relative', flex: 1, minHeight: 0 } }>{ children }</div>
		</div>
	);
}
