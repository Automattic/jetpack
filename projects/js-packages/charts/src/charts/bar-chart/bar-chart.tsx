import { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from '@visx/pattern';
import { Axis, Grid, XYChart } from '@visx/xychart';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { Fragment, useCallback, useContext, useState, useRef, useMemo } from 'react';
import { Legend } from '../../components/legend';
import { XYChartTooltip, useKeyboardNavigation } from '../../components/tooltip';
import {
	useXYChartTheme,
	useChartDataTransform,
	useZeroValueDisplay,
	useChartMargin,
	usePrefersReducedMotion,
} from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { useDefaultHiddenSeries } from '../../providers/chart-context/hooks/use-default-hidden-series';
import { attachSubComponents } from '../../utils';
import { warnOnce } from '../../utils/warn-once';
import { useChartChildren } from '../private/chart-composition';
import { ChartInstanceContext } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { formatReading, isInvalidReading } from '../private/readings';
import { getAllHiddenMessage, SvgEmptyState } from '../private/svg-empty-state';
import { hasOnlyWholeNumbers, WholeNumberTicks } from '../private/whole-number-ticks';
import { withResponsive } from '../private/with-responsive';
import plotStyles from '../private/xy-plot/xy-plot.module.scss';
import styles from './bar-chart.module.scss';
import {
	useBarChartOptions,
	BandHighlight,
	BandTooltip,
	BarLayer,
	ComparisonBars,
	DEFAULT_COMPARISON_WIDTH_FACTOR,
	COMPARISON_INNER_GAP,
	MAX_GROUP_PADDING,
	COMPARISON_TICK_GAP_FACTOR,
	BASE_BAND_PADDING_INNER,
	isBarRendered,
	SlotTooltipMembers,
	useBarStops,
	useOverlapSlots,
	getSelectedSlot,
	isSameCategory,
	membersAt,
} from './private';
import { useBarColors } from './use-bar-colors';
import { useBarLegendItems } from './use-bar-legend-items';
import type { ComparisonSeriesEntry, SelectedBar } from './private';
import type { BarChartProps } from './types';
import type { DataPointDate, SeriesData, Optional } from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { FC, ComponentType } from 'react';

export type { BarChartProps, BandHighlightSelection } from './types';

// Base props type with optional responsive properties
type BarChartBaseProps = Optional< BarChartProps, 'width' | 'height' | 'size' >;

// Composition API types
interface BarChartSubComponents {
	Legend: ComponentType< React.ComponentProps< typeof Legend > >;
}

type BarChartComponent = FC< BarChartBaseProps > & BarChartSubComponents;
type BarChartResponsiveComponent = FC< BarChartBaseProps & ResponsiveConfig > &
	BarChartSubComponents;

// Validation function similar to LineChart
const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return __( 'No data available', 'jetpack-charts' );

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isInvalidReading( point.value, { allowMissing: true } ) ||
				( ! point.label &&
					( ! ( 'date' in point && point.date ) || isNaN( point.date.getTime() ) ) )
		)
	);

	if ( hasInvalidData ) return __( 'Invalid data', 'jetpack-charts' );
	return null;
};

const getPatternId = ( chartId: string, index: number ) => `bar-pattern-${ chartId }-${ index }`;

// A "label: value" tooltip row. The join is a translated format string so the
// separator (a colon + space here) can be adapted per locale.
const renderTooltipRow = ( label: string | undefined, value: string ) => (
	<div className={ styles[ 'bar-chart__tooltip-row' ] }>
		{ sprintf(
			/* translators: 1: data series, period, or category label. 2: its formatted value. */
			__( '%1$s: %2$s', 'jetpack-charts' ),
			label,
			value
		) }
	</div>
);

const BarChartInternal: FC< BarChartProps > = ( {
	data,
	ariaLabel,
	chartId: providedChartId,
	width,
	height,
	className,
	margin,
	withTooltips = false,
	showLegend = false,
	legend = {},
	gridVisibility: gridVisibilityProp,
	renderTooltip,
	tooltipPlacement,
	tooltipAnchorTop,
	tooltipStyle,
	barClassName,
	options = {},
	orientation = 'vertical',
	layout = 'grouped',
	withPatterns = false,
	showZeroValues = false,
	withBandHighlight = false,
	onBandHighlightChange,
	defaultHiddenSeries,
	animation,
	children,
	gap = 'md',
	onPointerDown,
	onPointerUp,
	onDatumActivate,
} ) => {
	if ( ! withTooltips && ( withBandHighlight || onBandHighlightChange ) ) {
		warnOnce(
			'bar-chart-band-highlight-without-tooltips',
			'BarChart: withBandHighlight and onBandHighlightChange require withTooltips.'
		);
	}

	const legendInteractive = legend.interactive ?? false;
	const legendCollapseGroups = legend.collapseGroups ?? false;
	const legendComparisonItem = legend.comparisonItem ?? false;
	const legendComparisonSeriesItems = legend.comparisonSeriesItems;
	const horizontal = orientation === 'horizontal';
	const isOverlap = layout === 'overlap';
	const chartId = useChartId( providedChartId );
	const hiddenSeries = useDefaultHiddenSeries( chartId, defaultHiddenSeries );
	const isSeriesVisible = useCallback(
		( seriesLabel: string ) => ! hiddenSeries.has( seriesLabel ),
		[ hiddenSeries ]
	);
	const theme = useXYChartTheme( data );

	const dataSorted = useChartDataTransform( data );

	// Transform data to add a small value for zero bars to make them visible
	// For vertical bars, height determines bar pixel height; for horizontal bars, width does
	const dataWithVisibleZeros = useZeroValueDisplay( dataSorted, {
		enabled: showZeroValues,
		valueAxisLength: horizontal ? width : height,
	} );

	// Create legend items using the reusable hook
	const legendOptions = useMemo(
		() => ( {
			collapseGroups: legendCollapseGroups,
			comparisonItem: legendComparisonItem,
			comparisonSeriesItems: legendComparisonSeriesItems,
			layout,
		} ),
		[ legendCollapseGroups, legendComparisonItem, legendComparisonSeriesItems, layout ]
	);
	const legendItems = useBarLegendItems( dataSorted, legendOptions );

	const { getElementStyles, theme: providerTheme } = useGlobalChartsContext();
	const getBarColors = useBarColors();
	const barColors = useMemo(
		() => getBarColors( dataSorted, { layout } ),
		[ layout, getBarColors, dataSorted ]
	);

	if ( providerTheme.barChart?.barStyles?.comparison?.opacity !== undefined ) {
		warnOnce(
			'bar-chart-comparison-opacity',
			'BarChart: theme.barChart.barStyles.comparison.opacity is deprecated. Comparison bars are opaque; leave it unset.'
		);
	}

	// A hidden series is unmounted, so it is not on the band scale either — the
	// axis has to choose its tick values from what is left. Visibility is owned by
	// the provider, whether it changed through the legend or programmatically.
	const isSeriesRendered = useCallback(
		( series: SeriesData ) => isSeriesVisible( series.label ),
		[ isSeriesVisible ]
	);

	const hasWholeNumberValues = useMemo(
		() => hasOnlyWholeNumbers( dataSorted.filter( isSeriesRendered ) ),
		[ dataSorted, isSeriesRendered ]
	);

	const chartOptions = useBarChartOptions(
		dataWithVisibleZeros,
		horizontal,
		options,
		isSeriesRendered
	);
	const valueAxis = horizontal ? chartOptions.axis.x : chartOptions.axis.y;
	const callerValueDomain = horizontal ? options.xScale?.domain : options.yScale?.domain;
	const wholeNumberTicksProps = {
		axis: horizontal ? ( 'x' as const ) : ( 'y' as const ),
		numTicks: valueAxis.numTicks,
		enabled: hasWholeNumberValues && ! valueAxis.tickValues && ! callerValueDomain,
	};
	const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme, horizontal );
	const chartRef = useRef< HTMLDivElement >( null );

	// Process children for composition API (Legend, etc.)
	const { legendChildren, nonLegendChildren } = useChartChildren( children, 'BarChart' );
	const [ measuredChartHeight, setMeasuredChartHeight ] = useState< number | undefined >();

	const handleContentHeightChange = useCallback(
		( contentHeight: number ) => {
			const chartHeight = contentHeight > 0 ? contentHeight : height;
			setMeasuredChartHeight( chartHeight );
		},
		[ height ]
	);
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
	const [ isNavigating, setIsNavigating ] = useState( false );

	// Add visibility information from the shared legend state.
	const seriesWithVisibility = useMemo(
		() =>
			dataWithVisibleZeros.map( ( series, index ) => ( {
				series,
				index,
				isVisible: isSeriesRendered( series ),
			} ) ),
		[ dataWithVisibleZeros, isSeriesRendered ]
	);

	// Check if all series are hidden
	const allSeriesHidden = useMemo( () => {
		return seriesWithVisibility.every( ( { isVisible } ) => ! isVisible );
	}, [ seriesWithVisibility ] );

	// Derive primary vs comparison entries for comparison mode support.
	const primaryEntries = useMemo(
		() =>
			seriesWithVisibility.filter(
				( { isVisible, series } ) => isVisible && series.options?.type !== 'comparison'
			),
		[ seriesWithVisibility ]
	);

	const overlapSlots = useOverlapSlots( isOverlap, seriesWithVisibility );

	const primaryKeys = useMemo(
		() => primaryEntries.map( ( { series } ) => series.label ),
		[ primaryEntries ]
	);

	// The keyboard index space, the highlight and `XYChartTooltip` must share these stops, or the tooltip's datum diverges from the highlighted bar.
	const stops = useBarStops( overlapSlots, primaryEntries );
	const { barAt, stopOf } = stops;

	const activateSelectedBar = useCallback(
		( stop: number ) => {
			const bar = barAt( stop );
			if ( bar ) {
				onDatumActivate?.( bar );
			}
		},
		[ barAt, onDatumActivate ]
	);

	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown, onChartPointerMove } =
		useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: stops.count,
			onActivate: activateSelectedBar,
			visibleSeriesKey: stops.key,
		} );

	const handlePointerMove = useCallback(
		( { key, index }: { key: string; index: number } ) => {
			const stop = stopOf( key, index );
			if ( stop !== undefined ) {
				onChartPointerMove( stop );
			}
		},
		[ stopOf, onChartPointerMove ]
	);

	const comparisonEntries = useMemo( () => {
		// An overlap layout draws its comparisons as slotted bars, not as shadows.
		if ( isOverlap ) {
			return [];
		}

		const primaryByGroup = new Map< string | undefined, { label: string; index: number } >(
			primaryEntries.map( ( { series, index } ) => [
				series.group,
				{ label: series.label, index },
			] )
		);

		const entries: ComparisonSeriesEntry[] = [];
		seriesWithVisibility.forEach( ( { series, index, isVisible } ) => {
			if ( ! isVisible || series.options?.type !== 'comparison' ) {
				return;
			}
			const primary =
				primaryByGroup.get( series.group ) ??
				( primaryEntries.length === 1
					? { label: primaryEntries[ 0 ].series.label, index: primaryEntries[ 0 ].index }
					: undefined );
			if ( ! primary || ! primaryKeys.includes( primary.label ) ) {
				return;
			}
			entries.push( { series, index, primaryKey: primary.label } );
		} );
		return entries;
	}, [ isOverlap, seriesWithVisibility, primaryEntries, primaryKeys ] );

	// Comparison widthFactor (how much wider the shadow is than the primary) drives both the
	// shadow width (in ComparisonBars) and the primary narrowing.
	const comparisonWidthFactor = useMemo( () => {
		if ( comparisonEntries.length === 0 ) return undefined;
		return (
			getElementStyles( {
				data: comparisonEntries[ 0 ].series,
				index: comparisonEntries[ 0 ].index,
			} ).barStyles?.widthFactor ?? DEFAULT_COMPARISON_WIDTH_FACTOR
		);
	}, [ comparisonEntries, getElementStyles ] );

	// Narrow the primary bars by widening the visx group padding — a real geometry change, so
	// pattern fills and borders are not distorted (unlike a CSS transform/scale). The padding is
	// set so the comparison shadow (drawn at slot × widthFactor) fills all but a small gap of each
	// per-series step, leaving a small gap between series within a tick (the larger gap between
	// ticks comes from the category band's own padding). Because shadow = step × (1 - p) ×
	// widthFactor, choosing p = 1 - (1 - innerGap)/widthFactor makes the shadow span (1 - innerGap)
	// of the step; the primary stays 1/widthFactor of the shadow.
	const groupPadding = useMemo( () => {
		const basePadding = chartOptions.barGroup.padding;
		if ( ! comparisonWidthFactor || comparisonWidthFactor <= 1 ) {
			return basePadding;
		}
		const p = 1 - ( 1 - COMPARISON_INNER_GAP ) / comparisonWidthFactor;
		return Math.min( Math.max( p, basePadding ), MAX_GROUP_PADDING );
	}, [ chartOptions.barGroup.padding, comparisonWidthFactor ] );

	// In comparison mode, tighten the gap between ticks by reducing the category band's inner
	// padding (the value axis is left untouched). COMPARISON_TICK_GAP_FACTOR is the multiplier.
	const { xScale, yScale } = useMemo( () => {
		if ( comparisonEntries.length === 0 ) {
			return { xScale: chartOptions.xScale, yScale: chartOptions.yScale };
		}
		const tighten = < T extends object >( scale: T ): T =>
			( {
				...scale,
				paddingInner:
					( ( scale as { paddingInner?: number } ).paddingInner ?? BASE_BAND_PADDING_INNER ) *
					COMPARISON_TICK_GAP_FACTOR,
			} ) as T;
		return horizontal
			? { xScale: chartOptions.xScale, yScale: tighten( chartOptions.yScale ) }
			: { xScale: tighten( chartOptions.xScale ), yScale: chartOptions.yScale };
	}, [ comparisonEntries.length, chartOptions.xScale, chartOptions.yScale, horizontal ] );

	const getBarBackground = useCallback(
		( index: number ) => ( datum: DataPointDate ) =>
			withPatterns
				? `url(#${ getPatternId( chartId, index ) })`
				: ( datum.color ?? barColors[ index ] ?? '' ),
		[ withPatterns, barColors, chartId ]
	);

	const resolveComparisonFill = useCallback(
		( entry: ComparisonSeriesEntry, datum: DataPointDate ) =>
			withPatterns
				? `url(#${ getPatternId( chartId, entry.index ) })`
				: ( datum.color ?? barColors[ entry.index ] ?? '' ),
		[ withPatterns, chartId, barColors ]
	);

	// Lists every series with a point at the hovered category, in the order of the data.
	const renderOverlapTooltip = useCallback(
		( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
			const nearestDatum = tooltipData?.nearestDatum?.datum;
			if ( ! nearestDatum ) return null;

			const datumByKey = tooltipData?.datumByKey ?? {};
			const categoryLabel = chartOptions.tooltip.labelFormatter(
				nearestDatum.label || ( nearestDatum.date ? nearestDatum.date.getTime() : 0 ),
				0,
				[]
			);

			return (
				<div className={ styles[ 'bar-chart__tooltip' ] }>
					<div className={ styles[ 'bar-chart__tooltip-header' ] }>{ categoryLabel }</div>
					{ dataSorted.flatMap( ( { label } ) => {
						const datum = datumByKey[ label ]?.datum;
						return datum
							? [
									<Fragment key={ label }>
										{ renderTooltipRow( label, formatReading( datum.value ) ) }
									</Fragment>,
								]
							: [];
					} ) }
				</div>
			);
		},
		[ chartOptions.tooltip, dataSorted ]
	);

	const renderDefaultTooltip = useCallback(
		( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
			const nearestDatum = tooltipData?.nearestDatum?.datum;
			if ( ! nearestDatum ) return null;

			const primaryKey = tooltipData?.nearestDatum?.key;
			const categoryLabel = chartOptions.tooltip.labelFormatter(
				nearestDatum.label || ( nearestDatum.date ? nearestDatum.date.getTime() : 0 ),
				0,
				[]
			);

			// Find the comparison value paired with the hovered primary series (same group)
			// at the same category, so the tooltip can show both periods at once.
			const comparisonEntry = comparisonEntries.find( entry => entry.primaryKey === primaryKey );
			const comparisonDatum = comparisonEntry?.series.data.find( point =>
				isSameCategory( point as DataPointDate, nearestDatum )
			) as DataPointDate | undefined;

			// With a paired comparison value, show the category as the header and one row
			// per period (primary + comparison).
			if ( comparisonEntry && comparisonDatum ) {
				return (
					<div className={ styles[ 'bar-chart__tooltip' ] }>
						<div className={ styles[ 'bar-chart__tooltip-header' ] }>{ categoryLabel }</div>
						{ renderTooltipRow( primaryKey, formatReading( nearestDatum.value ) ) }
						{ renderTooltipRow(
							comparisonEntry.series.label,
							formatReading( comparisonDatum.value )
						) }
					</div>
				);
			}

			return (
				<div className={ styles[ 'bar-chart__tooltip' ] }>
					<div className={ styles[ 'bar-chart__tooltip-header' ] }>{ primaryKey }</div>
					{ renderTooltipRow( categoryLabel, formatReading( nearestDatum.value ) ) }
				</div>
			);
		},
		[ chartOptions.tooltip, comparisonEntries ]
	);

	const renderPattern = useCallback(
		( index: number, color: string ) => {
			const patternType = index % 4;
			const id = getPatternId( chartId, index );
			const commonProps = {
				id,
				stroke: 'white',
				strokeWidth: 1,
				background: color,
			};

			switch ( patternType ) {
				case 0:
				default:
					return (
						<PatternLines
							key={ id }
							{ ...commonProps }
							width={ 5 }
							height={ 5 }
							orientation={ [ 'diagonal' ] }
						/>
					);
				case 1:
					return (
						<PatternCircles key={ id } { ...commonProps } width={ 6 } height={ 6 } fill="white" />
					);
				case 2:
					return <PatternWaves key={ id } { ...commonProps } width={ 4 } height={ 4 } />;
				case 3:
					return <PatternHexagons key={ id } { ...commonProps } size={ 8 } height={ 3 } />;
			}
		},
		[ chartId ]
	);

	const createPatternBorderStyle = useCallback(
		( index: number, color: string ) => {
			const patternId = getPatternId( chartId, index );
			// Border the primary bars and any comparison shadow reusing the same pattern,
			// so a patterned shadow gets the same outline as its primary bar.
			return `
			.visx-bar[fill="url(#${ patternId })"],
			.bar-chart__comparison-bar[fill="url(#${ patternId })"] {
				stroke: ${ color };
				stroke-width: 1;
				}
			`;
		},
		[ chartId ]
	);

	const overlapBandSlots = useMemo(
		() => overlapSlots && { keys: overlapSlots.slotKeys, slotOf: overlapSlots.slotOf },
		[ overlapSlots ]
	);

	const selectedSlot = useMemo(
		() => getSelectedSlot( overlapSlots, selectedIndex ),
		[ overlapSlots, selectedIndex ]
	);

	const selectedGroup = useMemo( () => {
		const stop = overlapSlots || selectedIndex === undefined ? undefined : barAt( selectedIndex );
		if ( ! stop ) {
			return undefined;
		}
		return membersAt( primaryEntries, stop.datum, stop.key );
	}, [ overlapSlots, selectedIndex, barAt, primaryEntries ] );

	const selectedMembers = selectedSlot?.members ?? selectedGroup;

	const selectedBar = useMemo( (): SelectedBar | undefined => {
		if ( overlapSlots ) {
			return selectedSlot;
		}
		const bar = selectedIndex === undefined ? undefined : barAt( selectedIndex );
		return bar && isBarRendered( bar.datum )
			? { data: [ bar.datum ], slotKey: bar.key, thickness: 1 }
			: undefined;
	}, [ overlapSlots, selectedSlot, selectedIndex, barAt ] );

	// Validate data first
	const error = validateData( dataSorted );
	const isDataValid = ! error;

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			orientation,
			withPatterns,
		} ),
		[ orientation, withPatterns ]
	);

	// Register chart with context only if data is valid
	useChartRegistration( {
		chartId,
		legendItems,
		chartType: 'bar',
		isDataValid,
		metadata: chartMetadata,
	} );

	const prefersReducedMotion = usePrefersReducedMotion();

	if ( error ) {
		return <div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>{ error }</div>;
	}

	const gridVisibility = gridVisibilityProp ?? chartOptions.gridVisibility;

	const legendPosition = legend.position ?? 'bottom';
	const legendElement = showLegend && (
		<Legend
			orientation={ legend.orientation ?? 'horizontal' }
			position={ legendPosition }
			alignment={ legend.alignment ?? 'center' }
			labelStyles={ legend.labelStyles }
			itemClassName={ legend.itemClassName }
			itemStyles={ legend.itemStyles }
			shapeStyles={ legend.shapeStyles }
			className={ styles[ 'bar-chart__legend' ] }
			shape={ legend.shape ?? 'rect' }
			chartId={ chartId }
			interactive={ legendInteractive }
		/>
	);

	return (
		<ChartInstanceContext.Provider
			value={ {
				chartId,
				isSeriesVisible,
				chartWidth: width,
				chartHeight: measuredChartHeight || 0,
			} }
		>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				gap={ gap }
				className={ clsx(
					'bar-chart',
					styles[ 'bar-chart' ],
					{
						[ styles[ `bar-chart--animated${ horizontal ? '-horizontal' : '' }` ] ]:
							animation && ! prefersReducedMotion,
					},
					className
				) }
				style={ { width, height } }
				data-testid="bar-chart"
				data-chart-id={ `bar-chart-${ chartId }` }
				trailingContent={ nonLegendChildren }
				onContentHeightChange={ handleContentHeightChange }
			>
				{ ( { contentHeight } ) => {
					const chartHeight = contentHeight > 0 ? contentHeight : height;

					return (
						// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the application role hands arrow keys to the chart's point navigation.
						<div
							role="application"
							ref={ chartRef }
							aria-label={ ariaLabel ?? __( 'Bar chart', 'jetpack-charts' ) }
							tabIndex={ 0 }
							onKeyDown={ onChartKeyDown }
							onFocus={ onChartFocus }
							onBlur={ onChartBlur }
						>
							{ chartHeight > 0 && (
								<div className={ plotStyles[ 'xy-plot' ] }>
									<XYChart
										accessibilityLabel=""
										theme={ theme }
										width={ width }
										height={ chartHeight }
										margin={ {
											...defaultMargin,
											...margin,
										} }
										xScale={ xScale }
										yScale={ yScale }
										horizontal={ horizontal }
										pointerEventsDataKey="nearest"
									>
										{ withTooltips && ( withBandHighlight || onBandHighlightChange ) && (
											<BandHighlight
												visible={ withBandHighlight }
												horizontal={ horizontal }
												onChange={ onBandHighlightChange }
											/>
										) }

										{ ! allSeriesHidden && (
											<WholeNumberTicks { ...wholeNumberTicksProps }>
												{ valueTicks => (
													<>
														{ /* Visx forwards tickValues to its grid primitives but omits it from GridProps. */ }
														<Grid
															columns={ gridVisibility.includes( 'y' ) }
															rows={ false }
															numTicks={ chartOptions.axis.x.numTicks }
															{ ...{
																tickValues:
																	( horizontal ? valueTicks : undefined ) ??
																	chartOptions.axis.x.tickValues,
															} }
														/>
														<Grid
															columns={ false }
															rows={ gridVisibility.includes( 'x' ) }
															numTicks={ chartOptions.axis.y.numTicks }
															{ ...{
																tickValues:
																	( horizontal ? undefined : valueTicks ) ??
																	chartOptions.axis.y.tickValues,
															} }
														/>
													</>
												) }
											</WholeNumberTicks>
										) }

										{ withPatterns && (
											<>
												<defs data-testid="bar-chart-patterns">
													{ barColors.map( ( color, index ) => renderPattern( index, color ) ) }
												</defs>
												<style>
													{ barColors.map( ( color, index ) =>
														createPatternBorderStyle( index, color )
													) }
												</style>
											</>
										) }

										{ allSeriesHidden ? (
											<SvgEmptyState
												x={ width / 2 }
												y={ chartHeight / 2 }
												width={ width }
												height={ chartHeight }
											>
												{ getAllHiddenMessage( legendInteractive, 'series' ) }
											</SvgEmptyState>
										) : null }

										<ComparisonBars
											comparisonEntries={ comparisonEntries }
											primaryKeys={ primaryKeys }
											groupPadding={ groupPadding }
											horizontal={ horizontal }
											xAccessor={ chartOptions.accessors.xAccessor }
											yAccessor={
												chartOptions.accessors.yAccessor as (
													d: DataPointDate
												) => number | undefined
											}
											getElementStyles={ getElementStyles }
											resolveFill={ resolveComparisonFill }
										/>

										<BarLayer
											chartId={ chartId }
											overlapSlots={ overlapSlots }
											selectedBar={ selectedBar }
											primaryEntries={ primaryEntries }
											primaryKeys={ primaryKeys }
											getBarBackground={ getBarBackground }
											barClassName={ barClassName }
											groupPadding={ groupPadding }
											horizontal={ horizontal }
											xAccessor={ chartOptions.accessors.xAccessor }
											yAccessor={ chartOptions.accessors.yAccessor }
										/>
										{ /* Do not reorder: for one key the last showTooltip wins, so this must run after the primary series. */ }
										{ ( withTooltips || onPointerDown || onPointerUp ) && (
											<BandTooltip
												keys={ overlapSlots?.keys ?? primaryKeys }
												slots={ overlapBandSlots }
												groupPadding={ groupPadding }
												withTooltips={ withTooltips }
												onPointerDown={ onPointerDown }
												onPointerUp={ onPointerUp }
												onPointerMove={ handlePointerMove }
											/>
										) }

										{ /* With every series hidden there is no data to build the value scale from, so
										     visx collapses the domain and the axes render squished at the top. Drop them
										     while the empty state stands in. */ }
										{ ! allSeriesHidden && (
											<WholeNumberTicks { ...wholeNumberTicksProps }>
												{ valueTicks => (
													<>
														{ chartOptions.axis.x.display !== false && (
															<Axis
																{ ...chartOptions.axis.x }
																{ ...( horizontal && valueTicks
																	? { tickValues: valueTicks }
																	: {} ) }
															/>
														) }
														{ chartOptions.axis.y.display !== false && (
															<Axis
																{ ...chartOptions.axis.y }
																{ ...( ! horizontal && valueTicks
																	? { tickValues: valueTicks }
																	: {} ) }
															/>
														) }
													</>
												) }
											</WholeNumberTicks>
										) }

										{ withTooltips && selectedMembers && (
											<SlotTooltipMembers members={ selectedMembers } />
										) }
										{ withTooltips && (
											<XYChartTooltip
												tooltipPlacement={ tooltipPlacement }
												tooltipAnchorTop={ tooltipAnchorTop }
												style={ tooltipStyle }
												detectBounds
												snapTooltipToDatumX
												snapTooltipToDatumY
												renderTooltip={
													renderTooltip ||
													( isOverlap ? renderOverlapTooltip : renderDefaultTooltip )
												}
												selectedIndex={ selectedIndex }
												tooltipRef={ tooltipRef }
												keyboardFocusedClassName={
													styles[ 'bar-chart__tooltip--keyboard-focused' ]
												}
												mode="individual"
											/>
										) }
									</XYChart>
								</div>
							) }
						</div>
					);
				} }
			</ChartLayout>
		</ChartInstanceContext.Provider>
	);
};

const BarChartWithProvider: FC< BarChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <BarChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<BarChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

BarChartWithProvider.displayName = 'BarChart';

// Create BarChart with composition API
const BarChart = attachSubComponents( BarChartWithProvider, {
	Legend: Legend,
} ) as BarChartComponent;

// Create responsive BarChart with composition API
const BarChartResponsive = attachSubComponents(
	withResponsive< BarChartProps >( BarChartWithProvider ),
	{
		Legend: Legend,
	}
) as BarChartResponsiveComponent;

export { BarChartResponsive as default, BarChart as BarChartUnresponsive };
