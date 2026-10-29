/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalGrid as Grid, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useContext, useMemo, type FC, type MouseEvent } from 'react';
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
import { ChartInstanceContext } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { getAllHiddenMessage } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import { useFittedRowCount, useLeaderboardLegendItems } from './hooks';
import styles from './leaderboard-chart.module.scss';
import {
	resolveLeaderboardEntries,
	type ResolvedLeaderboardEntry,
} from './private/resolve-leaderboard-entries';
import type { LeaderboardChartProps } from './types';
import type { LeaderboardEntry } from '../../types';

// Handed to `Grid` as a chain rather than set in this component's stylesheet: `Grid` writes
// its own gaps through an Emotion class, which a module class of equal specificity would not
// reliably outrank. The chain lands on the element and resolves there.
const ROW_GAP = 'var(--a8c-charts-dimension-leaderboard-row-gap, 12px)';
const COLUMN_GAP = 'var(--a8c-charts-dimension-leaderboard-column-gap, 4px)';

/** Indexed by `Math.sign( delta ) + 1`, so [negative, neutral, positive]. */
const DELTA_TREND_CLASS = [ 'deltaValue--down', 'deltaValue--neutral', 'deltaValue--up' ] as const;

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
	`calc(${ share }% - var(--a8c-charts-dimension-leaderboard-bar-hover-inset, 0px) * ${ share } / 100)`;

const hasPreviousValue = (
	entry: ResolvedLeaderboardEntry
): entry is ResolvedLeaderboardEntry & {
	previousValue: number;
	previousShare: number;
} => entry.previousValue != null && entry.previousShare != null;

const hasDeltaValue = (
	entry: ResolvedLeaderboardEntry
): entry is ResolvedLeaderboardEntry & {
	previousValue: number;
	previousShare: number;
	delta: number;
} => hasPreviousValue( entry ) && entry.delta != null;

/**
 * A layered row's cell that takes pointer events of its own (a value tooltip)
 * sits above the row button; pass its clicks on so they still drill down.
 *
 * @param event - The click on the row.
 */
function forwardCellClickToRowButton( event: MouseEvent< HTMLDivElement > ) {
	if ( ( event.target as Element ).closest( 'a, button' ) ) {
		return;
	}

	event.currentTarget.querySelector< HTMLButtonElement >( ':scope > button' )?.click();
}

const BarLabel = ( { label }: { label: LeaderboardEntry[ 'label' ] } ) => (
	<>{ typeof label === 'string' ? <Text className={ styles.label }>{ label }</Text> : label }</>
);

/** The largest negative and positive share magnitudes, which size each side of zero. */
type DivergingScale = { negative: number; positive: number };

const Bar = ( {
	share,
	color,
	animation,
	divergingScale,
}: {
	share: number;
	color: string;
	animation?: boolean;
	divergingScale?: DivergingScale;
} ) => {
	const isNegative = share < 0;
	const sideMax = divergingScale?.[ isNegative ? 'negative' : 'positive' ];
	// A diverging bar is measured against the largest share on its own side of zero.
	const width = sideMax ? ( Math.abs( share ) / sideMax ) * 100 : Math.abs( share );

	const bar = (
		<div
			data-testid="leaderboard-chart-bar"
			className={ clsx( styles.bar, {
				[ styles[ 'bar--animated' ] ]: animation,
				[ styles[ 'bar--negative' ] ]: divergingScale && isNegative,
			} ) }
			style={ {
				width: getBarWidth( width ),
				backgroundColor: color,
			} }
		></div>
	);

	if ( ! divergingScale ) {
		return bar;
	}

	// Each side is as wide as its share of the full range, so zero sits where the range crosses it.
	return (
		<div
			className={ styles.barTrack }
			style={ {
				gridTemplateColumns: `${ divergingScale.negative }fr ${ divergingScale.positive }fr`,
			} }
		>
			{ bar }
		</div>
	);
};

const BarWithLabel = ( {
	entry,
	withComparison,
	withOverlayLabel,
	primaryColor,
	secondaryColor,
	animation,
	divergingScale,
	isPrimaryVisible = true,
	isComparisonVisible = true,
}: {
	entry: ResolvedLeaderboardEntry;
	withComparison?: boolean;
	withOverlayLabel?: boolean;
	primaryColor: string;
	secondaryColor: string;
	divergingScale?: DivergingScale;
	isPrimaryVisible?: boolean;
	isComparisonVisible?: boolean;
	animation?: boolean;
} ) => {
	const showComparisonBar = withComparison && ! withOverlayLabel && isComparisonVisible;

	const bars = (
		<>
			{ isPrimaryVisible && (
				<Bar
					share={ entry.currentShare }
					color={ primaryColor }
					animation={ animation }
					divergingScale={ divergingScale }
				/>
			) }

			{ showComparisonBar && hasPreviousValue( entry ) && (
				<Bar
					share={ entry.previousShare }
					color={ secondaryColor }
					animation={ animation }
					divergingScale={ divergingScale }
				/>
			) }
		</>
	);

	return (
		<div
			className={ clsx( styles.barWithLabelContainer, {
				[ styles[ 'is-overlay' ] ]: withOverlayLabel,
			} ) }
			data-testid={ divergingScale ? 'leaderboard-chart-diverging-row' : undefined }
		>
			<BarLabel label={ entry.label } />
			{ bars }
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
 * @param props.fitRows          - Whether to show only the rows that fit the chart's height
 * @param props.animation        - Whether the chart should animate on load
 * @param props.showLegend       - Whether to show legend
 * @param props.legend           - Legend configuration (orientation, position, alignment, shape, shapeStyles, interactive)
 * @param props.legendLabels     - Custom labels for legend items
 * @param props.gap              - Spacing between legend and chart content
 * @param props.children         - Child components for composition API
 * @param props.className        - Additional CSS class name
 * @param props.style            - Custom styling for the chart container
 * @param props.ariaLabel        - Accessible name for the list, defaulting to "Leaderboard chart"
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
	fitRows = false,
	showLegend = false,
	legend = {},
	legendLabels,
	gap = 'md',
	ariaLabel,
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
	const { labelSpacing } = leaderboardChartSettings;
	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();
	const { color: resolvedPrimaryColor } = getElementStyles( {
		index: 0,
		overrideColor: primaryColor,
	} );
	const { color: resolvedSecondaryColor } = getElementStyles( {
		index: 1,
		overrideColor: secondaryColor,
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

	// Track visibility of primary and comparison series from the shared legend state.
	const isPrimaryVisible = useMemo( () => {
		if ( legendItems.length === 0 ) {
			return true;
		}
		return isSeriesVisible( chartId, legendItems[ 0 ].label );
	}, [ chartId, legendItems, isSeriesVisible ] );

	const isComparisonVisible = useMemo( () => {
		if ( legendItems.length < 2 ) {
			return true;
		}
		return isSeriesVisible( chartId, legendItems[ 1 ].label );
	}, [ chartId, legendItems, isSeriesVisible ] );

	// Check if all series are hidden
	const allSeriesHidden = useMemo( () => {
		if ( withComparison && ! withOverlayLabel ) {
			return ! isPrimaryVisible && ! isComparisonVisible;
		}
		return ! isPrimaryVisible;
	}, [ isPrimaryVisible, isComparisonVisible, withComparison, withOverlayLabel ] );

	const withComparisonBars = withComparison && ! withOverlayLabel;

	const resolvedData = useMemo(
		() => resolveLeaderboardEntries( data ?? [], { includePrevious: withComparisonBars } ),
		[ data, withComparisonBars ]
	);

	// One negative share puts every row on a shared zero point, so the bars stay comparable.
	const divergingScale = useMemo( (): DivergingScale | undefined => {
		const scale = { negative: 0, positive: 0 };
		for ( const entry of resolvedData ) {
			const shares = [ entry.currentShare ];
			if ( withComparisonBars && hasPreviousValue( entry ) ) {
				shares.push( entry.previousShare );
			}
			for ( const share of shares ) {
				const side = share < 0 ? 'negative' : 'positive';
				scale[ side ] = Math.max( scale[ side ], Math.abs( share ) );
			}
		}
		return scale.negative > 0 ? scale : undefined;
	}, [ resolvedData, withComparisonBars ] );

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

	// There are no rows to measure while every series is hidden, whether from an
	// interactive legend click or a programmatic toggle. Pausing fitting restores
	// the full row count and, when a series is shown again, re-runs the effect
	// against the newly mounted grid.
	const { contentRef, fittedCount, isMeasurable } = useFittedRowCount(
		fitRows && ! allSeriesHidden,
		data?.length ?? 0,
		data
	);
	const shouldFitRows = fitRows && isMeasurable;
	// Comparing adds a delta track so the values and the deltas each line up in a column
	// of their own; with either series hidden the grid keeps its two tracks.
	const showComparisonColumn = withComparison && isComparisonVisible;
	const templateColumns =
		showComparisonColumn && isPrimaryVisible ? 'minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto';

	// Handle empty or undefined data
	if ( ! data || data.length === 0 ) {
		return (
			<ChartInstanceContext.Provider value={ { chartId } }>
				<ChartLayout
					legendPosition={ legendPosition }
					legendElement={ false }
					legendChildren={ legendChildren }
					className={ clsx(
						'leaderboard-chart',
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
			</ChartInstanceContext.Provider>
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
		<ChartInstanceContext.Provider value={ { chartId } }>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				className={ clsx(
					'leaderboard-chart',
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
				<div
					ref={ contentRef }
					data-testid="leaderboard-chart-content"
					className={ clsx( styles.leaderboardChart__content, {
						[ styles[ 'leaderboardChart__content--fit' ] ]: shouldFitRows,
					} ) }
				>
					{ shouldFitRows && fittedCount === 0 && ! allSeriesHidden && (
						// Overlaid, not swapped in: the rows must stay laid out to stay measurable.
						<div className={ clsx( styles.emptyState, styles.fitEmptyState ) }>
							{ __( 'Not enough space to display data', 'jetpack-charts' ) }
						</div>
					) }
					{ allSeriesHidden ? (
						<div className={ styles.emptyState }>
							{ getAllHiddenMessage( legendInteractive, 'series' ) }
						</div>
					) : (
						<Grid
							role="list"
							aria-label={ ariaLabel ?? __( 'Leaderboard chart', 'jetpack-charts' ) }
							templateColumns={ templateColumns }
							rowGap={ ROW_GAP }
							columnGap={ COLUMN_GAP }
							data-leaderboard-grid
						>
							{ resolvedData.map( ( entry, rowIndex ) => {
								// visibility, not clipping: hidden rows keep their geometry (so a
								// taller container can reveal them) but leave hit testing, focus,
								// and the accessibility tree.
								const rowStyle =
									shouldFitRows && rowIndex >= fittedCount
										? ( { visibility: 'hidden' } as const )
										: undefined;
								const hasPreviousPeriodValue = hasPreviousValue( entry );
								const hasDelta = hasDeltaValue( entry );
								const showComparisonValue = showComparisonColumn && hasDelta;
								const showComparisonPlaceholder = showComparisonColumn && ! hasDelta;
								// Math.sign gives -1/0/1; the placeholder has no delta to read, so it takes neutral.
								const deltaTrendClass =
									styles[
										DELTA_TREND_CLASS[ showComparisonValue ? Math.sign( entry.delta ) + 1 : 1 ]
									];

								const rowCells = (
									<>
										<Stack direction="column" gap={ labelSpacing }>
											<BarWithLabel
												entry={ entry }
												withComparison={ withComparison }
												withOverlayLabel={ withOverlayLabel }
												primaryColor={ resolvedPrimaryColor }
												secondaryColor={ resolvedSecondaryColor }
												divergingScale={ divergingScale }
												isPrimaryVisible={ isPrimaryVisible }
												isComparisonVisible={ isComparisonVisible }
												animation={ animation && ! loading && ! prefersReducedMotion }
											/>
										</Stack>

										<div
											className={ clsx( styles.valueContainer, {
												[ styles.overlayLabel ]: withOverlayLabel,
											} ) }
										>
											{ isPrimaryVisible && <Text>{ valueFormatter( entry.currentValue ) }</Text> }

											{ showComparisonValue && (
												<Text className={ clsx( styles.deltaValue, deltaTrendClass ) }>
													{ deltaFormatter( entry.delta ) }
												</Text>
											) }

											{ showComparisonPlaceholder && (
												<Text
													className={ clsx(
														styles.deltaValue,
														styles.deltaPlaceholder,
														deltaTrendClass
													) }
												>
													<span aria-hidden="true">—</span>
													<VisuallyHidden as="span">
														{ hasPreviousPeriodValue
															? __( 'Percentage change unavailable', 'jetpack-charts' )
															: __( 'No comparison data', 'jetpack-charts' ) }
													</VisuallyHidden>
												</Text>
											) }
										</div>
									</>
								);

								if ( entry.onClick && entry.hasInteractiveLabel ) {
									return (
										<div
											key={ entry.id }
											role="listitem"
											data-row-index={ rowIndex }
											style={ rowStyle }
											className={ styles.rowItem }
										>
											{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Mouse-only fallback; the row button carries keyboard access. */ }
											<div
												className={ clsx( styles.row, styles.interactiveRow, styles.layeredRow ) }
												onClick={ forwardCellClickToRowButton }
											>
												{ rowCells }
												<button
													type="button"
													className={ styles.rowButton }
													onClick={ entry.onClick }
													aria-label={ entry.ariaLabel }
												/>
												<Icon className={ styles.chevron } icon={ chevronRight } size={ 24 } />
											</div>
										</div>
									);
								}

								if ( entry.onClick ) {
									return (
										<div
											key={ entry.id }
											role="listitem"
											data-row-index={ rowIndex }
											style={ rowStyle }
											className={ styles.rowItem }
										>
											<button
												type="button"
												className={ clsx( styles.row, styles.interactiveRow ) }
												onClick={ entry.onClick }
												aria-label={ entry.ariaLabel }
											>
												{ rowCells }
												<Icon className={ styles.chevron } icon={ chevronRight } size={ 24 } />
											</button>
										</div>
									);
								}

								return (
									<div
										key={ entry.id }
										role="listitem"
										data-row-index={ rowIndex }
										style={ rowStyle }
										className={ styles.row }
									>
										{ rowCells }
									</div>
								);
							} ) }
						</Grid>
					) }
				</div>
			</ChartLayout>
		</ChartInstanceContext.Provider>
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
