import { type ReactNode } from 'react';
import { BaseChartProps, LeaderboardEntry } from '../../types';
import type { LegendShapeStyles } from '../../components/legend';

export interface LeaderboardChartProps
	extends Pick<
		BaseChartProps< LeaderboardEntry >,
		| 'className'
		| 'data'
		| 'showLegend'
		| 'legendOrientation'
		| 'legendPosition'
		| 'legendAlignment'
		| 'legendShape'
		| 'chartId'
		| 'width'
		| 'height'
		| 'size'
		| 'gap'
		| 'legendInteractive'
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
	 * Custom styling for the chart container
	 */
	style?: React.CSSProperties & {
		'--a8c--charts--leaderboard--bar--border-radius'?: string;
	};

	/**
	 * Styles for legend shapes (width, height, margin).
	 */
	legendShapeStyles?: LegendShapeStyles;

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
