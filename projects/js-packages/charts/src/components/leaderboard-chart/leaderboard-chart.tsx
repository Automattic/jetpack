/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import clsx from 'clsx';
import { useContext, type FC } from 'react';
import {
	GlobalChartsContext,
	GlobalChartsProvider,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers/chart-context';
import { formatMetricValue } from '../../utils';
import styles from './leaderboard-chart.module.scss';
import type { LeaderboardChartProps } from './types';
import type { LeaderboardEntry } from '../../types';

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
	primaryColor,
	secondaryColor,
}: {
	entry: LeaderboardEntry;
	withComparison?: boolean;
	withOverlayLabel?: boolean;
	primaryColor: string;
	secondaryColor: string;
} ) => (
	<div
		className={ clsx( styles.barWithLabelContainer, {
			[ styles[ 'is-overlay' ] ]: withOverlayLabel,
		} ) }
	>
		<BarLabel label={ entry.label } />

		<div
			className={ styles.bar }
			style={ {
				width: entry.currentShare + '%',
				backgroundColor: primaryColor,
			} }
		></div>

		{ withComparison && ! withOverlayLabel && (
			<div
				className={ styles.bar }
				style={ {
					width: entry.previousShare + '%',
					backgroundColor: secondaryColor,
				} }
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
const LeaderboardChartInternal: FC< LeaderboardChartProps > = ( {
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
	const { leaderboardChart: leaderboardChartSettings } = useGlobalChartsTheme();
	const {
		labelSpacing,
		rowGap,
		columnGap,
		primaryColor: settingsPrimaryColor,
		secondaryColor: settingsSecondaryColor,
		deltaColors,
	} = leaderboardChartSettings;
	const { resolveGroupColor } = useGlobalChartsContext();
	const resolvedPrimaryColor = resolveGroupColor( {
		index: 0,
		overrideColor: primaryColor || settingsPrimaryColor,
	} );
	const resolvedSecondaryColor = resolveGroupColor( {
		index: 1,
		overrideColor: secondaryColor || settingsSecondaryColor,
	} );

	// Handle empty or undefined data
	if ( ! data || data.length === 0 ) {
		return (
			<div
				className={ clsx( styles.leaderboardChart, loading && styles.loading, className ) }
				style={ style }
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
			style={ style }
		>
			{ data.map( entry => {
				const colorIndex = Math.sign( entry.delta ) + 1;
				const deltaColor = deltaColors[ colorIndex ];

				return (
					<Fragment key={ entry.id }>
						<VStack spacing={ labelSpacing }>
							<BarWithLabel
								entry={ entry }
								withComparison={ withComparison }
								withOverlayLabel={ withOverlayLabel }
								primaryColor={ resolvedPrimaryColor }
								secondaryColor={ resolvedSecondaryColor }
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

const LeaderboardChart: FC< LeaderboardChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <LeaderboardChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<LeaderboardChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

export default LeaderboardChart;
