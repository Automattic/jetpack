/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useContext, useMemo, type FC } from 'react';
import {
	GlobalChartsContext,
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers';
import containerStyles from '../../styles/chart-container.module.scss';
import { formatMetricValue, attachSubComponents } from '../../utils';
import { Legend } from '../legend';
import { useChartChildren } from '../private/chart-composition';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import { useLeaderboardLegendItems } from './hooks';
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
 * @param props                   - Component props
 * @param props.data              - Array of leaderboard entries to display
 * @param props.chartId           - Optional unique identifier for the chart
 * @param props.withComparison    - Whether to show comparison data
 * @param props.withOverlayLabel  - Whether to overlay the label on top of the bar
 * @param props.primaryColor      - Primary color for current period bars
 * @param props.secondaryColor    - Secondary color for comparison period bars
 * @param props.valueFormatter    - Custom formatter for values
 * @param props.deltaFormatter    - Custom formatter for delta values
 * @param props.loading           - Whether the chart is in loading state
 * @param props.showLegend        - Whether to show legend
 * @param props.legendOrientation - Legend orientation
 * @param props.legendPosition    - Legend position
 * @param props.legendAlignment   - Legend alignment
 * @param props.legendShape       - Legend shape
 * @param props.legendShapeWidth  - Width of legend shapes in pixels
 * @param props.legendShapeHeight - Height of legend shapes in pixels
 * @param props.legendLabels      - Custom labels for legend items
 * @param props.children          - Child components for composition API
 * @param props.className         - Additional CSS class name
 * @param props.style             - Custom styling for the chart container
 * @return JSX element representing the leaderboard chart
 */
const LeaderboardChartInternal: FC< LeaderboardChartProps > = ( {
	data,
	chartId: providedChartId,
	withComparison = false,
	withOverlayLabel = false,
	primaryColor,
	secondaryColor,
	valueFormatter = defaultValueFormatter,
	deltaFormatter = defaultDeltaFormatter,
	loading = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	legendPosition = 'bottom',
	legendAlignment = 'center',
	legendShape = 'circle',
	legendShapeWidth = 8,
	legendShapeHeight = 8,
	legendLabels,
	className,
	style,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const { leaderboardChart: leaderboardChartSettings } = useGlobalChartsTheme();

	// Process children to extract compound components
	const { otherChildren } = useChartChildren( children, 'LeaderboardChart' );
	const {
		labelSpacing,
		rowGap,
		columnGap,
		primaryColor: settingsPrimaryColor,
		secondaryColor: settingsSecondaryColor,
		deltaColors,
	} = leaderboardChartSettings;
	const { getElementStyles } = useGlobalChartsContext();
	const { color: resolvedPrimaryColor } = getElementStyles( {
		index: 0,
		overrideColor: primaryColor || settingsPrimaryColor,
	} );
	const { color: resolvedSecondaryColor } = getElementStyles( {
		index: 1,
		overrideColor: secondaryColor || settingsSecondaryColor,
	} );

	// Create legend items using the custom hook
	const legendItems = useLeaderboardLegendItems( {
		data: data || [],
		primaryColor,
		secondaryColor,
		withComparison,
		withOverlayLabel,
		legendLabels,
	} );

	// Validate data
	const isDataValid = Boolean( data && data.length > 0 );

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			withComparison,
			withOverlayLabel,
		} ),
		[ withComparison, withOverlayLabel ]
	);

	// Register chart with context
	useChartRegistration( {
		chartId,
		legendItems,
		chartType: 'leaderboard',
		isDataValid,
		metadata: chartMetadata,
	} );

	// Handle empty or undefined data
	if ( ! data || data.length === 0 ) {
		return (
			<SingleChartContext.Provider
				value={ {
					chartId,
					chartWidth: 0, // LeaderboardChart doesn't need specific dimensions
					chartHeight: 0,
				} }
			>
				<div
					className={ clsx( styles.leaderboardChart, loading && styles.loading, className ) }
					style={ style }
				>
					<div className={ styles.emptyState }>
						{ loading
							? __( 'Loading…', 'jetpack-charts' )
							: __( 'No data available', 'jetpack-charts' ) }
					</div>
					{ /* Render children from composition API */ }
					{ otherChildren }
				</div>
			</SingleChartContext.Provider>
		);
	}

	return (
		<SingleChartContext.Provider
			value={ {
				chartId,
				chartWidth: 0, // LeaderboardChart doesn't need specific dimensions
				chartHeight: 0,
			} }
		>
			<div
				className={ clsx(
					styles.leaderboardChart,
					containerStyles[ 'chart-container' ],
					containerStyles[
						showLegend && legendPosition === 'top'
							? 'chart-container--legend-top'
							: 'chart-container--legend-bottom'
					],
					loading && styles.loading,
					className
				) }
				style={ {
					...style,
					gap: showLegend ? '16px' : '0',
				} }
			>
				<Grid templateColumns="minmax(0, 1fr) auto" rowGap={ rowGap } columnGap={ columnGap }>
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

				{ showLegend && (
					<Legend
						orientation={ legendOrientation }
						position={ legendPosition }
						alignment={ legendAlignment }
						shape={ legendShape }
						shapeWidth={ legendShapeWidth }
						shapeHeight={ legendShapeHeight }
						chartId={ chartId }
					/>
				) }

				{ /* Render children from composition API */ }
				{ otherChildren }
			</div>
		</SingleChartContext.Provider>
	);
};

const LeaderboardChartWithProvider: FC< LeaderboardChartProps > = props => {
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

LeaderboardChartWithProvider.displayName = 'LeaderboardChart';

// Create LeaderboardChart with composition API
const LeaderboardChart = attachSubComponents( LeaderboardChartWithProvider, {
	Legend: Legend,
} );

// Create responsive LeaderboardChart with composition API
const LeaderboardChartResponsive = attachSubComponents(
	withResponsive< LeaderboardChartProps >( LeaderboardChartWithProvider ),
	{
		Legend: Legend,
	}
);

export { LeaderboardChartResponsive as default, LeaderboardChart as LeaderboardChartUnresponsive };
