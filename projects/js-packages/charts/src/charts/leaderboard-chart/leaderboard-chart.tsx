/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalGrid as Grid, VisuallyHidden } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useContext, useMemo, type FC } from 'react';
import { Legend } from '../../components/legend';
import { usePrefersReducedMotion } from '../../hooks';
import {
	GlobalChartsContext,
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers';
import { formatMetricValue, attachSubComponents } from '../../utils';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
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

/**
 * Build a bar's width. A hover-inset CSS variable (0 by default) is subtracted
 * on hover, scaled by the bar's share so the pull-back is proportional to its
 * length: the full-length (100%) bar — the one that reaches the value — pulls
 * back the whole inset to keep its gap with the value, while shorter bars pull
 * back proportionally less, down to ~0 for a very short bar.
 *
 * @param share - The bar's share of the row width, as a percentage.
 * @return A CSS width value.
 */
const getBarWidth = ( share: number ): string =>
	`calc(${ share }% - var(--a8c--charts--leaderboard--bar--hover-inset, 0px) * ${ share } / 100)`;

const hasComparisonValue = (
	entry: LeaderboardEntry
): entry is LeaderboardEntry & {
	previousValue: number;
	previousShare: number;
	delta: number;
} => entry.previousValue != null && entry.previousShare != null && entry.delta != null;

const BarLabel = ( { label }: { label: LeaderboardEntry[ 'label' ] } ) => (
	<>{ typeof label === 'string' ? <Text className={ styles.label }>{ label }</Text> : label }</>
);

const BarWithLabel = ( {
	entry,
	withComparison,
	withOverlayLabel,
	primaryColor,
	secondaryColor,
	animation,
	isPrimaryVisible = true,
	isComparisonVisible = true,
}: {
	entry: LeaderboardEntry;
	withComparison?: boolean;
	withOverlayLabel?: boolean;
	primaryColor: string;
	secondaryColor: string;
	isPrimaryVisible?: boolean;
	isComparisonVisible?: boolean;
	animation?: boolean;
} ) => {
	const showComparisonBar = withComparison && ! withOverlayLabel && isComparisonVisible;

	return (
		<div
			className={ clsx( styles.barWithLabelContainer, {
				[ styles[ 'is-overlay' ] ]: withOverlayLabel,
			} ) }
		>
			<BarLabel label={ entry.label } />

			{ isPrimaryVisible && (
				<div
					className={ clsx( styles.bar, {
						[ styles[ 'bar--animated' ] ]: animation,
					} ) }
					style={ {
						width: getBarWidth( entry.currentShare ),
						backgroundColor: primaryColor,
					} }
				></div>
			) }

			{ showComparisonBar && hasComparisonValue( entry ) && (
				<div
					className={ clsx( styles.bar, {
						[ styles[ 'bar--animated' ] ]: animation,
					} ) }
					style={ {
						width: getBarWidth( entry.previousShare ),
						backgroundColor: secondaryColor,
					} }
				></div>
			) }
		</div>
	);
};

/**
 * LeaderboardChart component displays a ranked list of data with progress bars
 * and optional comparison values.
 *
 * @param props                  - Component props
 * @param props.data             - Array of leaderboard entries to display
 * @param props.chartId          - Optional unique identifier for the chart
 * @param props.width            - Optional width of the chart container in pixels
 * @param props.height           - Optional height of the chart container in pixels
 * @param props.withComparison   - Whether to show comparison data
 * @param props.withOverlayLabel - Whether to overlay the label on top of the bar
 * @param props.primaryColor     - Primary color for current period bars
 * @param props.secondaryColor   - Secondary color for comparison period bars
 * @param props.valueFormatter   - Custom formatter for values
 * @param props.deltaFormatter   - Custom formatter for delta values
 * @param props.loading          - Whether the chart is in loading state
 * @param props.animation        - Whether the chart should animate on load
 * @param props.showLegend       - Whether to show legend
 * @param props.legend           - Legend configuration (orientation, position, alignment, shape, shapeStyles, interactive)
 * @param props.legendLabels     - Custom labels for legend items
 * @param props.gap              - Spacing between legend and chart content
 * @param props.children         - Child components for composition API
 * @param props.className        - Additional CSS class name
 * @param props.style            - Custom styling for the chart container
 * @return JSX element representing the leaderboard chart
 */
const LeaderboardChartInternal: FC< LeaderboardChartProps > = ( {
	data,
	chartId: providedChartId,
	width: propWidth,
	height: propHeight,
	withComparison = false,
	withOverlayLabel = false,
	primaryColor,
	secondaryColor,
	valueFormatter = defaultValueFormatter,
	deltaFormatter = defaultDeltaFormatter,
	animation,
	loading = false,
	showLegend = false,
	legend = {},
	legendLabels,
	gap = 'md',
	className,
	style,
	children,
} ) => {
	const legendInteractive = legend.interactive ?? false;
	const legendPosition = legend.position ?? 'bottom';

	const chartId = useChartId( providedChartId );
	const { leaderboardChart: leaderboardChartSettings } = useGlobalChartsTheme();
	const legendShapeStyles = { width: 8, height: 8, ...legend.shapeStyles };

	// Process children to extract compound components
	const { legendChildren, nonLegendChildren } = useChartChildren( children, 'LeaderboardChart' );
	const {
		labelSpacing,
		rowGap,
		columnGap,
		primaryColor: settingsPrimaryColor,
		secondaryColor: settingsSecondaryColor,
		deltaColors,
	} = leaderboardChartSettings;
	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();
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

	// Track visibility of primary and comparison series for interactive legends
	const isPrimaryVisible = useMemo( () => {
		if ( ! chartId || ! legendInteractive || legendItems.length === 0 ) {
			return true;
		}
		return isSeriesVisible( chartId, legendItems[ 0 ].label );
	}, [ chartId, legendInteractive, legendItems, isSeriesVisible ] );

	const isComparisonVisible = useMemo( () => {
		if ( ! chartId || ! legendInteractive || legendItems.length < 2 ) {
			return true;
		}
		return isSeriesVisible( chartId, legendItems[ 1 ].label );
	}, [ chartId, legendInteractive, legendItems, isSeriesVisible ] );

	// Check if all series are hidden
	const allSeriesHidden = useMemo( () => {
		if ( ! legendInteractive ) return false;
		if ( withComparison && ! withOverlayLabel ) {
			return ! isPrimaryVisible && ! isComparisonVisible;
		}
		return ! isPrimaryVisible;
	}, [
		legendInteractive,
		isPrimaryVisible,
		isComparisonVisible,
		withComparison,
		withOverlayLabel,
	] );

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

	const prefersReducedMotion = usePrefersReducedMotion();

	// Handle empty or undefined data
	if ( ! data || data.length === 0 ) {
		return (
			<SingleChartContext.Provider value={ { chartId } }>
				<ChartLayout
					legendPosition={ legendPosition }
					legendElement={ false }
					legendChildren={ legendChildren }
					className={ clsx(
						styles.leaderboardChart,
						{
							[ styles[ 'leaderboardChart--responsive' ] ]: ! propWidth && ! propHeight,
							[ styles[ 'leaderboardChart--loading' ] ]: loading,
						},
						className
					) }
					gap={ gap }
					style={ { ...style, width: propWidth || undefined, height: propHeight || undefined } }
					data-testid="leaderboard-chart-container"
					trailingContent={ nonLegendChildren }
				>
					<div className={ styles.emptyState }>
						{ loading
							? __( 'Loading…', 'jetpack-charts' )
							: __( 'No data available', 'jetpack-charts' ) }
					</div>
				</ChartLayout>
			</SingleChartContext.Provider>
		);
	}

	const legendElement = showLegend && (
		<Legend
			orientation={ legend.orientation ?? 'horizontal' }
			position={ legendPosition }
			alignment={ legend.alignment ?? 'center' }
			labelStyles={ legend.labelStyles }
			itemClassName={ legend.itemClassName }
			itemStyles={ legend.itemStyles }
			shape={ legend.shape ?? 'circle' }
			shapeStyles={ legendShapeStyles }
			chartId={ chartId }
			interactive={ legendInteractive }
		/>
	);

	return (
		<SingleChartContext.Provider value={ { chartId } }>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				className={ clsx(
					styles.leaderboardChart,
					{
						[ styles[ 'leaderboardChart--responsive' ] ]: ! propWidth && ! propHeight,
						[ styles[ 'leaderboardChart--loading' ] ]: loading,
					},
					className
				) }
				gap={ gap }
				style={ {
					...style,
					width: propWidth || undefined,
					height: propHeight || undefined,
				} }
				data-testid="leaderboard-chart-container"
				trailingContent={ nonLegendChildren }
			>
				<div className={ styles.leaderboardChart__content }>
					{ allSeriesHidden ? (
						<div className={ styles.emptyState }>
							{ __( 'All series are hidden. Click legend items to show data.', 'jetpack-charts' ) }
						</div>
					) : (
						<Grid templateColumns="minmax(0, 1fr) auto" rowGap={ rowGap } columnGap={ columnGap }>
							{ data.map( entry => {
								const showComparisonColumn = withComparison && isComparisonVisible;
								const hasDeltaValue = hasComparisonValue( entry );
								const showComparisonValue = showComparisonColumn && hasDeltaValue;
								const showComparisonPlaceholder = showComparisonColumn && ! hasDeltaValue;
								const colorIndex = showComparisonValue ? Math.sign( entry.delta ) + 1 : 1;
								const deltaColor = deltaColors[ colorIndex ];

								const rowCells = (
									<>
										<Stack direction="column" gap={ labelSpacing }>
											<BarWithLabel
												entry={ entry }
												withComparison={ withComparison }
												withOverlayLabel={ withOverlayLabel }
												primaryColor={ resolvedPrimaryColor }
												secondaryColor={ resolvedSecondaryColor }
												isPrimaryVisible={ isPrimaryVisible }
												isComparisonVisible={ isComparisonVisible }
												animation={ animation && ! loading && ! prefersReducedMotion }
											/>
										</Stack>

										<Stack
											direction="row"
											gap="xs"
											className={ clsx( styles.valueContainer, {
												[ styles.overlayLabel ]: withOverlayLabel,
											} ) }
										>
											{ isPrimaryVisible && <Text>{ valueFormatter( entry.currentValue ) }</Text> }

											{ showComparisonValue && (
												<Text className={ styles.deltaValue } style={ { color: deltaColor } }>
													{ deltaFormatter( entry.delta ) }
												</Text>
											) }

											{ showComparisonPlaceholder && (
												<Text
													className={ clsx( styles.deltaValue, styles.deltaPlaceholder ) }
													style={ { color: deltaColor } }
												>
													<span aria-hidden="true">-</span>
													<VisuallyHidden as="span">
														{ __( 'No comparison data', 'jetpack-charts' ) }
													</VisuallyHidden>
												</Text>
											) }
										</Stack>
									</>
								);

								if ( entry.onClick ) {
									return (
										<button
											key={ entry.id }
											type="button"
											className={ styles.interactiveRow }
											onClick={ entry.onClick }
											aria-label={ entry.ariaLabel }
										>
											{ rowCells }
											<Icon className={ styles.chevron } icon={ chevronRight } size={ 24 } />
										</button>
									);
								}

								return <Fragment key={ entry.id }>{ rowCells }</Fragment>;
							} ) }
						</Grid>
					) }
				</div>
			</ChartLayout>
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
