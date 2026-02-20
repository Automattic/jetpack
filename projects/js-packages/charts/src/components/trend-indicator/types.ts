import type { CSSProperties } from 'react';

/**
 * The direction of the trend
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Props for the TrendIndicator component
 */
export type TrendIndicatorProps = {
	/**
	 * The direction of the trend (up, down, or neutral)
	 */
	direction: TrendDirection;

	/**
	 * The value to display (e.g., "14%", "+$500", "2.5k")
	 */
	value: string | number;

	/**
	 * Additional CSS class name
	 */
	className?: string;

	/**
	 * Inline styles
	 */
	style?: CSSProperties;

	/**
	 * Whether to show the directional icon
	 * @default true
	 */
	showIcon?: boolean;
};
