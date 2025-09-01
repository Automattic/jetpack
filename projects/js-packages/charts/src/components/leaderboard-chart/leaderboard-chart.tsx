/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import clsx from 'clsx';
import { type FC } from 'react';
import { useGlobalChartsTheme } from '../../providers/chart-context';
import { formatMetricValue } from '../../utils';
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
	 * Human-readable name (e.g., 'Direct') or a JSX element (e.g., <h4>Direct</h4>)
	 */
	label: string | JSX.Element;

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

	/**
	 * Optional color for the entry's image/icon
	 */
	imageColor?: string;
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
	 * Additional CSS class name for the chart container
	 */
	className?: string;

	/**
	 * Custom styling for the chart container
	 */
	style?: React.CSSProperties & {
		'--bar-border'?: string;
		'--primary-color'?: string;
		'--secondary-color'?: string;
	};
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

const BarLabel = ( { label }: { label: string | JSX.Element } ) => (
	<>{ typeof label === 'string' ? <Text className={ styles.label }>{ label }</Text> : label }</>
);

const BarWithLabel = ( {
	entry,
	withComparison,
	withOverlayLabel,
}: {
	entry: LeaderboardEntry;
	withComparison?: boolean;
	withOverlayLabel?: boolean;
} ) => (
	<div
		className={ clsx( styles.barWithLabelContainer, {
			[ styles[ 'is-overlay' ] ]: withOverlayLabel,
		} ) }
	>
		<BarLabel label={ entry.label } />

		<div
			className={ clsx( styles.bar, styles.primaryBar ) }
			style={ { width: entry.currentShare + '%' } }
		></div>

		{ withComparison && ! withOverlayLabel && (
			<div
				className={ clsx( styles.bar, styles.secondaryBar ) }
				style={ { width: entry.previousShare + '%' } }
			></div>
		) }
	</div>
);

/**
 * LeaderboardChart component displays a ranked list of data with progress bars
 * and optional comparison values.
 *
 * @param props                  - Component props
 * @param props.data             - Array of leaderboard entries to display
 * @param props.withComparison   - Whether to show comparison data
 * @param props.withOverlayLabel - Whether to overlay the label on top of the bar
 * @param props.primaryColor     - Primary color for current period bars
 * @param props.secondaryColor   - Secondary color for comparison period bars
 * @param props.valueFormatter   - Custom formatter for values
 * @param props.deltaFormatter   - Custom formatter for delta values
 * @param props.loading          - Whether the chart is in loading state
 * @param props.className        - Additional CSS class name
 * @param props.style            - Custom styling for the chart container
 * @return JSX element representing the leaderboard chart
 */
export const LeaderboardChart: FC< LeaderboardChartProps > = ( {
	data,
	withComparison = false,
	withOverlayLabel = false,
	primaryColor,
	secondaryColor,
	valueFormatter = defaultValueFormatter,
	deltaFormatter = defaultDeltaFormatter,
	loading = false,
	className,
	style,
} ) => {
	const theme = useGlobalChartsTheme();

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
	};

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
							<BarWithLabel
								entry={ entry }
								withComparison={ withComparison }
								withOverlayLabel={ withOverlayLabel }
							/>
						</VStack>

						<div
							className={ clsx( styles.valueContainer, {
								[ styles.overlayLabel ]: withOverlayLabel,
							} ) }
						>
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
