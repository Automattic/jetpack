/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	ProgressBar,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import clsx from 'clsx';
import { type FC } from 'react';
import { useChartTheme } from '../../providers/theme';
import { formatMetricValue } from '../shared/format-metric-value';
import styles from './leaderboard-chart.module.scss';

/**
 * Default settings for LeaderboardChart component
 */
const DEFAULT_LEADERBOARD_SETTINGS = {
	labelSpacing: 1.5,
	rowGap: 12,
	columnGap: 4,
	primaryColor: '#3858E9',
	secondaryColor: '#66BDFF',
	deltaColors: [ '#D63638', '#757575', '#008A20' ] as [ string, string, string ],
} as const;
export interface LeaderboardEntry {
	/**
	 * Unique internal key (e.g., 'key-direct')
	 */
	id: string;

	/**
	 * Human-readable name (e.g., 'Direct')
	 */
	label: string;

	/**
	 * Value of the entry
	 */
	currentValue: number;

	/**
	 * Value of the entry in the previous period
	 */
	previousValue: number;

	/**
	 * Width of current bar, as % of the current value
	 */
	currentShare: number;

	/**
	 * Width of previous bar, as % of the current value
	 */
	previousShare: number;

	/**
	 * Delta of the entry
	 */
	delta: number;
}

export interface LeaderboardChartProps {
	/**
	 * Array of leaderboard entries to display
	 */
	data: LeaderboardEntry[];

	/**
	 * Whether to show comparison data
	 */
	withComparison?: boolean;

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
	 * Additional CSS class name for the chart container
	 */
	className?: string;

	/**
	 * Custom styling for the chart container
	 */
	style?: React.CSSProperties;
}

/**
 * Default value formatter using formatMetricValue
 *
 * @param value - The numeric value to format
 * @return Formatted string representation of the value
 */
const defaultValueFormatter = ( value: number ): string => {
	return formatMetricValue( value, 'number', {
		useMultipliers: true,
		decimals: 1,
	} );
};

/**
 * Default delta formatter using formatMetricValue
 *
 * @param value - The delta value to format
 * @return Formatted percentage string
 */
const defaultDeltaFormatter = ( value: number ): string => {
	return formatMetricValue( value / 100, 'average', {
		decimals: 0,
		signDisplay: 'exceptZero',
	} );
};

/**
 * LeaderboardChart component displays a ranked list of data with progress bars
 * and optional comparison values.
 *
 * @param props                - Component props
 * @param props.data           - Array of leaderboard entries to display
 * @param props.withComparison - Whether to show comparison data
 * @param props.primaryColor   - Primary color for current period bars
 * @param props.secondaryColor - Secondary color for comparison period bars
 * @param props.valueFormatter - Custom formatter for values
 * @param props.deltaFormatter - Custom formatter for delta values
 * @param props.loading        - Whether the chart is in loading state
 * @param props.className      - Additional CSS class name
 * @param props.style          - Custom styling for the chart container
 * @return JSX element representing the leaderboard chart
 */
export const LeaderboardChart: FC< LeaderboardChartProps > = ( {
	data,
	withComparison = false,
	primaryColor,
	secondaryColor,
	valueFormatter = defaultValueFormatter,
	deltaFormatter = defaultDeltaFormatter,
	loading = false,
	className,
	style,
} ) => {
	const theme = useChartTheme();

	// Get component settings from theme with fallbacks
	const leaderboardSettings = theme.leaderboardChart;
	const labelSpacing =
		leaderboardSettings?.labelSpacing ?? DEFAULT_LEADERBOARD_SETTINGS.labelSpacing;
	const rowGap = leaderboardSettings?.rowGap ?? DEFAULT_LEADERBOARD_SETTINGS.rowGap;
	const columnGap = leaderboardSettings?.columnGap ?? DEFAULT_LEADERBOARD_SETTINGS.columnGap;

	// Use theme colors with prop overrides, fallback to defaults
	const finalPrimaryColor =
		primaryColor || leaderboardSettings?.primaryColor || DEFAULT_LEADERBOARD_SETTINGS.primaryColor;
	const finalSecondaryColor =
		secondaryColor ||
		leaderboardSettings?.secondaryColor ||
		DEFAULT_LEADERBOARD_SETTINGS.secondaryColor;

	// Delta sign colors: negative, neutral, positive
	const signColors = leaderboardSettings?.deltaColors ?? DEFAULT_LEADERBOARD_SETTINGS.deltaColors;

	const chartStyle = {
		'--primary-color': finalPrimaryColor,
		'--secondary-color': finalSecondaryColor,
		...style,
	} as React.CSSProperties;

	// Handle empty or undefined data
	if ( ! data || data.length === 0 ) {
		return (
			<div
				className={ clsx( styles.leaderboardChart, loading && styles.loading, className ) }
				style={ chartStyle }
			>
				<div className={ styles.emptyState }>{ loading ? 'Loading...' : 'No data available' }</div>
			</div>
		);
	}

	return (
		<Grid
			className={ clsx( styles.leaderboardChart, loading && styles.loading, className ) }
			templateColumns="minmax(0, 1fr) auto"
			rowGap={ rowGap }
			columnGap={ columnGap }
			style={ chartStyle }
		>
			{ data.map( entry => {
				const colorIndex = Math.sign( entry.delta ) + 1;
				const deltaColor = signColors[ colorIndex ];

				return (
					<Fragment key={ entry.id }>
						<VStack spacing={ labelSpacing }>
							<Text>{ entry.label }</Text>

							<div className={ styles.progressContainer }>
								<ProgressBar
									value={ entry.currentShare }
									className={ clsx( styles.progressBar, styles.primaryBar ) }
								/>

								{ withComparison && (
									<ProgressBar
										value={ entry.previousShare }
										className={ clsx( styles.progressBar, styles.secondaryBar ) }
									/>
								) }
							</div>
						</VStack>

						<div className={ styles.valueContainer }>
							<Text>{ valueFormatter( entry.currentValue ) }</Text>

							{ withComparison && (
								<Text style={ { color: deltaColor } }>{ deltaFormatter( entry.delta ) }</Text>
							) }
						</div>
					</Fragment>
				);
			} ) }
		</Grid>
	);
};

export default LeaderboardChart;
