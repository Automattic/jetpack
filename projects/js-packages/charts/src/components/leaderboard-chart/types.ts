import { BaseChartProps, LeaderboardEntry } from '../../types';

export interface LeaderboardChartProps
	extends Pick< BaseChartProps< LeaderboardEntry >, 'className' | 'data' > {
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
}
