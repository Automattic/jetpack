import { formatNumber } from '@automattic/number-formatters';
import { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from '@visx/pattern';
import { Axis, BarSeries, BarGroup, Grid, XYChart } from '@visx/xychart';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useState, useRef, useMemo } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { AccessibleTooltip, useKeyboardNavigation } from '../../components/tooltip';
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
import { attachSubComponents } from '../../utils';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import styles from './bar-chart.module.scss';
import {
	useBarChartOptions,
	ComparisonBars,
	DEFAULT_COMPARISON_WIDTH_FACTOR,
	COMPARISON_INNER_GAP,
	MAX_GROUP_PADDING,
	COMPARISON_TICK_GAP_FACTOR,
	BASE_BAND_PADDING_INNER,
} from './private';
import type { ComparisonSeriesEntry } from './private';
import type { BaseChartProps, DataPointDate, SeriesData, Optional } from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { FC, ReactNode, ComponentType } from 'react';

export interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	orientation?: 'horizontal' | 'vertical';
	withPatterns?: boolean;
	showZeroValues?: boolean;
	children?: ReactNode;
}

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
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( ! point.label &&
					( ! ( 'date' in point && point.date ) || isNaN( point.date.getTime() ) ) )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
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
	options = {},
	orientation = 'vertical',
	withPatterns = false,
	showZeroValues = false,
	animation,
	children,
	gap = 'md',
} ) => {
	const legendInteractive = legend.interactive ?? false;
	const horizontal = orientation === 'horizontal';
	const chartId = useChartId( providedChartId );
	const theme = useXYChartTheme( data );

	const dataSorted = useChartDataTransform( data );

	// Transform data to add a small value for zero bars to make them visible
	// For vertical bars, height determines bar pixel height; for horizontal bars, width does
	const dataWithVisibleZeros = useZeroValueDisplay( dataSorted, {
		enabled: showZeroValues,
		valueAxisLength: horizontal ? width : height,
	} );

	// Create legend items using the reusable hook
	const legendItems = useChartLegendItems( dataSorted );
	const chartOptions = useBarChartOptions( dataWithVisibleZeros, horizontal, options );
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

	// Comparison series have no .visx-bar elements; count only primary series so
	// keyboard navigation doesn't cycle phantom indices into comparison-only slots.
	const primarySeriesForNav = dataWithVisibleZeros.filter( s => s.options?.type !== 'comparison' );
	const totalPoints =
		Math.max( 0, ...primarySeriesForNav.map( s => s.data?.length || 0 ) ) *
		primarySeriesForNav.length;

	// Use the keyboard navigation hook
	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints,
	} );

	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

	// Add visibility information to series when using interactive legends
	const seriesWithVisibility = useMemo( () => {
		if ( ! chartId || ! legendInteractive ) {
			return dataWithVisibleZeros.map( ( series, index ) => ( {
				series,
				index,
				isVisible: true,
			} ) );
		}
		return dataWithVisibleZeros.map( ( series, index ) => ( {
			series,
			index,
			isVisible: isSeriesVisible( chartId, series.label ),
		} ) );
	}, [ dataWithVisibleZeros, chartId, isSeriesVisible, legendInteractive ] );

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

	const primaryKeys = useMemo(
		() => primaryEntries.map( ( { series } ) => series.label ),
		[ primaryEntries ]
	);

	// The keyboard-navigation index space and the highlight CSS both stride over primary
	// bars only; the accessible tooltip must use the same list, or its datum diverges from
	// the highlighted bar once a comparison series shifts the indices.
	const primarySeries = useMemo(
		() => primaryEntries.map( ( { series } ) => series ),
		[ primaryEntries ]
	);

	const comparisonEntries = useMemo( () => {
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
			entries.push( { series, index, primaryKey: primary.label, primaryIndex: primary.index } );
		} );
		return entries;
	}, [ seriesWithVisibility, primaryEntries, primaryKeys ] );

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
		( index: number ) => () =>
			withPatterns
				? `url(#${ getPatternId( chartId, index ) })`
				: getElementStyles( { data: dataSorted[ index ], index } ).color,
		[ withPatterns, getElementStyles, dataSorted, chartId ]
	);

	// Comparison shadow fill: when patterns are on, reuse the paired primary's pattern so the
	// shadow reads as the same series; otherwise use the comparison series' resolved color.
	const resolveComparisonFill = useCallback(
		( entry: ComparisonSeriesEntry ) =>
			withPatterns
				? `url(#${ getPatternId( chartId, entry.primaryIndex ) })`
				: getElementStyles( { data: entry.series, index: entry.index } ).color,
		[ withPatterns, chartId, getElementStyles ]
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
			const comparisonDatum = comparisonEntry?.series.data.find( point => {
				const p = point as DataPointDate;
				return nearestDatum.label != null
					? p.label === nearestDatum.label
					: !! nearestDatum.date && !! p.date && p.date.getTime() === nearestDatum.date.getTime();
			} ) as DataPointDate | undefined;

			// With a paired comparison value, show the category as the header and one row
			// per period (primary + comparison).
			if ( comparisonEntry && comparisonDatum && comparisonDatum.value != null ) {
				return (
					<div className={ styles[ 'bar-chart__tooltip' ] }>
						<div className={ styles[ 'bar-chart__tooltip-header' ] }>{ categoryLabel }</div>
						{ renderTooltipRow( primaryKey, formatNumber( nearestDatum.value as number ) ) }
						{ renderTooltipRow(
							comparisonEntry.series.label,
							formatNumber( comparisonDatum.value as number )
						) }
					</div>
				);
			}

			return (
				<div className={ styles[ 'bar-chart__tooltip' ] }>
					<div className={ styles[ 'bar-chart__tooltip-header' ] }>{ primaryKey }</div>
					{ renderTooltipRow( categoryLabel, formatNumber( nearestDatum.value as number ) ) }
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
			.bar-chart__comparison-bars rect[fill="url(#${ patternId })"] {
				stroke: ${ color };
				stroke-width: 1;
				}
			`;
		},
		[ chartId ]
	);

	const createKeyboardHighlightStyle = useCallback( () => {
		if ( selectedIndex === undefined ) return '';

		// Use only primary entries — comparison series have no .visx-bar elements so
		// their indices must not appear in the nth-child selector.
		// Pattern: [series1[0], series2[0], series3[0], series1[1], series2[1], series3[1], ...]
		const primaryCount = primaryEntries.length;
		const maxDataPoints = Math.max( ...primaryEntries.map( e => e.series.data.length ) );
		const dataPointIndex = Math.floor( selectedIndex / primaryCount );
		const seriesIndex = selectedIndex % primaryCount;

		// Only highlight if we're within valid bounds
		if ( dataPointIndex >= maxDataPoints || seriesIndex >= primaryCount ) {
			return '';
		}

		const seriesData = primaryEntries[ seriesIndex ]?.series;
		if ( ! seriesData || dataPointIndex >= seriesData.data.length ) {
			return '';
		}

		// Based on the DOM structure analysis:
		// - All bars are in a single .visx-bar-group
		// - Bars are ordered as: [series1[0], series1[1], series2[0], series2[1], ...]
		// - So we need to calculate the actual bar index in the DOM
		const actualBarIndex = seriesIndex * maxDataPoints + dataPointIndex;

		// Use a CSS class selector instead of ID since useId() generates invalid CSS ID characters
		const generatedStyles = `
			.bar-chart[data-chart-id="bar-chart-${ chartId }"] .visx-bar-group .visx-bar:nth-child(${
				actualBarIndex + 1
			}) {
				stroke: #005fcc;
				stroke-width: 2px;
			}
		`;

		return generatedStyles;
	}, [ selectedIndex, primaryEntries, chartId ] );

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
	const highlightedBarStyle = createKeyboardHighlightStyle();

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
		<SingleChartContext.Provider
			value={ {
				chartId,
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
						<div
							role="grid"
							aria-label={ __( 'Bar chart', 'jetpack-charts' ) }
							tabIndex={ 0 }
							onKeyDown={ onChartKeyDown }
							onFocus={ onChartFocus }
							onBlur={ onChartBlur }
						>
							{ chartHeight > 0 && (
								<div ref={ chartRef }>
									<XYChart
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
										<Grid
											columns={ gridVisibility.includes( 'y' ) }
											rows={ gridVisibility.includes( 'x' ) }
											numTicks={ 4 }
										/>

										{ withPatterns && (
											<>
												<defs data-testid="bar-chart-patterns">
													{ dataSorted.map( ( seriesData, index ) =>
														renderPattern(
															index,
															getElementStyles( { data: seriesData, index } ).color
														)
													) }
												</defs>
												<style>
													{ dataSorted.map( ( seriesData, index ) =>
														createPatternBorderStyle(
															index,
															getElementStyles( { data: seriesData, index } ).color
														)
													) }
												</style>
											</>
										) }

										{ highlightedBarStyle && <style>{ highlightedBarStyle }</style> }

										{ allSeriesHidden ? (
											<SvgEmptyState
												x={ width / 2 }
												y={ chartHeight / 2 }
												width={ width }
												height={ chartHeight }
											>
												{ __(
													'All series are hidden. Click legend items to show data.',
													'jetpack-charts'
												) }
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

										<BarGroup padding={ groupPadding }>
											{ primaryEntries.map( ( { series: seriesData, index } ) => (
												<BarSeries
													key={ seriesData?.label }
													dataKey={ seriesData?.label }
													data={ seriesData.data as DataPointDate[] }
													yAccessor={ chartOptions.accessors.yAccessor }
													xAccessor={ chartOptions.accessors.xAccessor }
													colorAccessor={ getBarBackground( index ) }
												/>
											) ) }
										</BarGroup>

										<Axis { ...chartOptions.axis.x } />
										<Axis { ...chartOptions.axis.y } />

										{ withTooltips && (
											<AccessibleTooltip
												detectBounds
												snapTooltipToDatumX
												snapTooltipToDatumY
												renderTooltip={ renderTooltip || renderDefaultTooltip }
												selectedIndex={ selectedIndex }
												tooltipRef={ tooltipRef }
												keyboardFocusedClassName={
													styles[ 'bar-chart__tooltip--keyboard-focused' ]
												}
												series={ primarySeries }
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
		</SingleChartContext.Provider>
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
