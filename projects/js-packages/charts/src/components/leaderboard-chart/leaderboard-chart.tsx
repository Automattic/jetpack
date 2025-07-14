import clsx from 'clsx';
import { Fragment, type FC } from 'react';
import { formatMetricValue } from './format-metric-value';
import styles from './leaderboard-chart.module.scss';

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
 * Progress bar component
 *
 * @param props           - Component props
 * @param props.value     - Progress value as percentage (0-100)
 * @param props.className - Additional CSS class name
 * @param props.color     - Progress bar color
 * @return JSX element representing the progress bar
 */
const ProgressBar: FC< {
	value: number;
	className?: string;
	color?: string;
} > = ( { value, className, color } ) => (
	<div
		className={ clsx( styles.progressBar, className ) }
		style={ { '--progress-color': color } as React.CSSProperties }
	>
		<div
			className={ styles.progressBarFill }
			style={ { width: `${ Math.max( 0, Math.min( 100, value ) ) }%` } }
		/>
	</div>
);

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
	primaryColor = '#3858E9',
	secondaryColor = '#66BDFF',
	valueFormatter = defaultValueFormatter,
	deltaFormatter = defaultDeltaFormatter,
	loading = false,
	className,
	style,
} ) => {
	const signColors = [ '#D63638', '#757575', '#008A20' ];

	const chartStyle = {
		'--primary-color': primaryColor,
		'--secondary-color': secondaryColor,
		...style,
	} as React.CSSProperties;

	return (
		<div
			className={ clsx( styles.leaderboardChart, loading && styles.loading, className ) }
			style={ chartStyle }
		>
			{ data.map( entry => {
				const colorIndex = Math.sign( entry.delta ) + 1;
				const deltaColor = signColors[ colorIndex ];

				return (
					<Fragment key={ entry.id }>
						<div className={ styles.entryContainer }>
							<div className={ styles.labelContainer }>
								<span className={ styles.entryLabel }>{ entry.label }</span>

								<div className={ styles.progressContainer }>
									<ProgressBar
										value={ entry.currentShare }
										color={ primaryColor }
										className={ styles.primaryBar }
									/>

									{ withComparison && (
										<ProgressBar
											value={ entry.previousShare }
											color={ secondaryColor }
											className={ styles.secondaryBar }
										/>
									) }
								</div>
							</div>

							<div className={ styles.valueContainer }>
								<span className={ styles.currentValue }>
									{ valueFormatter( entry.currentValue ) }
								</span>

								{ withComparison && (
									<span className={ styles.deltaValue } style={ { color: deltaColor } }>
										{ deltaFormatter( entry.delta ) }
									</span>
								) }
							</div>
						</div>
					</Fragment>
				);
			} ) }
		</div>
	);
};

export default LeaderboardChart;
