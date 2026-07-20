import { type ReactNode } from 'react';
import { BaseChartProps, LeaderboardEntry } from '../../types';

export interface LeaderboardChartProps
	extends Pick<
		BaseChartProps< LeaderboardEntry >,
		| 'className'
		| 'data'
		| 'showLegend'
		| 'legend'
		| 'chartId'
		| 'width'
		| 'height'
		| 'size'
		| 'gap'
		| 'animation'
	> {
	/**
	 * Whether to show comparison data
	 */
	withComparison?: boolean;

	/**
	 * Whether to overlay the label on top of bar
	 */
	withOverlayLabel?: boolean;

	/**
	 * Primary color for current period bars
	 */
	primaryColor?: string;

	/**
	 * Secondary color for comparison period bars
	 */
	secondaryColor?: string;

	/**
	 * Formatter for values
	 */
	valueFormatter?: ( value: number ) => string;

	/**
	 * Formatter for delta values
	 */
	deltaFormatter?: ( value: number ) => string;

	/**
	 * Whether the chart is in loading state
	 */
	loading?: boolean;

	/**
	 * Show only the rows that fit the chart's height instead of scrolling.
	 *
	 * Off by default, so a standalone chart keeps its scrollable row list. Turn
	 * it on inside a fixed-height container — such as a dashboard tile — where an
	 * inner scrollbar is unexpected. Rows that do not fit stay measurable and
	 * reappear as soon as the container grows, but are hidden from painting, hit
	 * testing, focus order, and the accessibility tree.
	 */
	fitRows?: boolean;

	/**
	 * Custom styling for the chart container
	 */
	style?: React.CSSProperties & {
		'--a8c--charts--leaderboard--bar--border-radius'?: string;
	};

	/**
	 * Custom labels for legend items
	 */
	legendLabels?: {
		/**
		 * Label for primary period data
		 */
		primary?: string;
		/**
		 * Label for comparison period data (only used when withComparison is true)
		 */
		comparison?: string;
	};

	/**
	 * Child components for composition API
	 */
	children?: ReactNode;
}
