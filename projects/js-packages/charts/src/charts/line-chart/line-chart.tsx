import { formatNumberCompact, formatNumber } from '@automattic/number-formatters';
import { LinearGradient } from '@visx/gradient';
import { XYChart, AreaSeries, Grid, Axis, DataContext } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import {
	useMemo,
	useContext,
	forwardRef,
	useImperativeHandle,
	useState,
	useRef,
	useCallback,
} from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { AccessibleTooltip, useKeyboardNavigation } from '../../components/tooltip';
import {
	useXYChartTheme,
	useChartDataTransform,
	useChartMargin,
	usePrefersReducedMotion,
} from '../../hooks';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	useChartFormatting,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers';
import { useDefaultHiddenSeries } from '../../providers/chart-context/hooks/use-default-hidden-series';
import { attachSubComponents } from '../../utils';
import { createDateFormatter } from '../../utils/date-formatting';
import { useChartChildren } from '../private/chart-composition';
import { ChartInstanceContext, type ChartInstanceRef } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { DefaultGlyph } from '../private/default-glyph';
import { getAllHiddenMessage, SvgEmptyState } from '../private/svg-empty-state';
import { getBucketInfo, getCurveType } from '../private/time-axis';
import { buildTimeAxisOptions } from '../private/time-axis-options';
import { withResponsive } from '../private/with-responsive';
import { useXZoom, ZoomResetButton, ZoomSelectionRect, ZoomClip } from '../private/x-zoom';
import styles from './line-chart.module.scss';
import { LineChartAnnotation, LineChartAnnotationsOverlay, LineChartGlyph } from './private';
import type { RenderLineGlyphProps, LineChartProps, TooltipDatum } from './types';
import type {
	BucketInfo,
	DataPoint,
	DataPointDate,
	SeriesData,
	Optional,
	TickResolution,
} from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { TickFormatter } from '@visx/axis';
import type { GlyphProps } from '@visx/xychart';
import type { FC, Ref } from 'react';

const defaultRenderGlyph = < Datum extends object >( props: RenderLineGlyphProps< Datum > ) => {
	return <DefaultGlyph { ...props } key={ props.key } />;
};

const toNumber = ( val?: number | string | null ): number | undefined => {
	const num = typeof val === 'number' ? val : parseFloat( val );
	return isNaN( num ) ? undefined : num;
};

// No date-part options, which is what `Intl` defaults to a numeric date for —
// the heading the tooltip printed with `toLocaleDateString()` before it could
// be told a locale and a zone.
const TOOLTIP_DATE: Intl.DateTimeFormatOptions = {};

// Hour reuses the same numeric date `TOOLTIP_DATE` renders and adds the hour,
// so hourly and daily headings share a style and differ only in detail.
const TOOLTIP_FORMAT_BY_RESOLUTION: Record<
	Exclude< TickResolution, 'week' >,
	Intl.DateTimeFormatOptions
> = {
	hour: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: true },
	day: TOOLTIP_DATE,
	month: { month: 'long', year: 'numeric' },
	year: { year: 'numeric' },
};

// A component rather than a call, because `renderDefaultTooltip` is a plain
// function a consumer may pass around: the context has to be read where the
// heading renders, not where the tooltip is built.
const TooltipDate: FC< { date?: Date; displayResolution: Exclude< TickResolution, 'week' > } > = ( {
	date,
	displayResolution,
} ) => {
	const formatting = useChartFormatting();
	const format = useMemo(
		() => createDateFormatter( TOOLTIP_FORMAT_BY_RESOLUTION[ displayResolution ], formatting ),
		[ displayResolution, formatting ]
	);

	return <>{ date ? format( date ) : null }</>;
};

/**
 * Default visx-tooltip render that prints the hovered date as a heading and
 * one row per visible series (label + formatted value), sorted descending by
 * value. Reused by AreaChart, which has the same multi-series shape.
 *
 * @param params - visx `RenderTooltipParams< DataPointDate >`, plus the chart's optional `bucketInfo`.
 * @return Tooltip JSX, or `null` when no datum is hovered.
 */
export const renderDefaultTooltip = (
	params: RenderTooltipParams< DataPointDate > & { bucketInfo?: BucketInfo }
) => {
	const { tooltipData, bucketInfo } = params;
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: TooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-date' ] }>
				<TooltipDate
					date={ nearestDatum.date }
					displayResolution={ bucketInfo?.displayResolution ?? 'day' }
				/>
			</div>
			{ tooltipPoints.map( point => (
				<Stack
					key={ point.key }
					direction="row"
					align="center"
					justify="space-between"
					className={ styles[ 'line-chart__tooltip-row' ] }
				>
					<span className={ styles[ 'line-chart__tooltip-label' ] }>{ point.key }:</span>
					<span className={ styles[ 'line-chart__tooltip-value' ] }>
						{ formatNumber( point.value ) }
					</span>
				</Stack>
			) ) }
		</div>
	);
};

const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( 'date' in point && point.date && isNaN( point.date.getTime() ) )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

// Inner component to access DataContext and provide scale data to ref
const LineChartScalesRef: FC< {
	chartRef?: Ref< ChartInstanceRef >;
	width: number;
	height: number;
	margin?: { top?: number; right?: number; bottom?: number; left?: number };
} > = ( { chartRef, width, height, margin } ) => {
	const context = useContext( DataContext );

	useImperativeHandle(
		chartRef,
		() => ( {
			getScales: () => {
				if ( ! context?.xScale || ! context?.yScale ) {
					return null;
				}
				return {
					xScale: context.xScale,
					yScale: context.yScale,
				};
			},
			getChartDimensions: () => ( {
				width,
				height,
				margin: margin || {},
			} ),
		} ),
		[ context, width, height, margin ]
	);

	return null; // This component only provides the ref interface
};

const LineChartInternal = forwardRef< ChartInstanceRef, LineChartProps >(
	(
		{
			data,
			chartId: providedChartId,
			width,
			height,
			className,
			margin,
			withTooltips = true,
			withTooltipCrosshairs,
			showLegend = false,
			legend = {},
			renderGlyph = defaultRenderGlyph,
			glyphStyle = {},
			withLegendGlyph = false,
			withGradientFill = false,
			smoothing = true,
			curveType,
			renderTooltip = renderDefaultTooltip,
			withStartGlyphs = false,
			withEndGlyphs = false,
			animation,
			options = {},
			onPointerDown = undefined,
			onPointerUp = undefined,
			onPointerMove = undefined,
			onPointerOut = undefined,
			onDatumActivate = undefined,
			zoomable = false,
			rescaleYOnVisibilityChange = true,
			defaultHiddenSeries,
			children,
			gridVisibility,
			gap = 'md',
		},
		ref
	) => {
		const legendInteractive = legend.interactive ?? false;
		const legendCollapseGroups = legend.collapseGroups ?? false;
		const legendShape = legend.shape ?? 'line';
		const legendPosition = legend.position ?? 'bottom';

		const providerTheme = useGlobalChartsTheme();
		const formatting = useChartFormatting();
		const theme = useXYChartTheme( data );
		// Gradient stops apply this as an SVG attribute, where CSS var() cannot resolve. useXYChartTheme has already resolved the same role inside its memo, against the chart's scope element, so read it back rather than paying another getComputedStyle on every render.
		const resolvedBackgroundColor = theme.backgroundColor ?? providerTheme.backgroundColor;
		const chartId = useChartId( providedChartId );
		const hiddenSeries = useDefaultHiddenSeries( chartId, defaultHiddenSeries );
		const isSeriesVisible = useCallback(
			( seriesLabel: string ) => ! hiddenSeries.has( seriesLabel ),
			[ hiddenSeries ]
		);
		const chartRef = useRef< HTMLDivElement >( null );
		const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
		const [ isNavigating, setIsNavigating ] = useState( false );
		const internalChartRef = useRef< ChartInstanceRef >( null );

		const zoom = useXZoom< Date >( {
			enabled: zoomable,
			chartRef: internalChartRef,
			userHandlers: { onPointerDown, onPointerMove, onPointerUp },
		} );

		// Process children for composition API (Legend, etc.)
		const { legendChildren, nonLegendChildren } = useChartChildren( children, 'LineChart' );
		const [ measuredChartHeight, setMeasuredChartHeight ] = useState< number | undefined >();

		// Callback for ChartLayout to notify us when the measured content height changes.
		// We compute chartHeight the same way the render prop does so the context stays in sync.
		const handleContentHeightChange = useCallback(
			( contentHeight: number ) => {
				const chartHeight = contentHeight > 0 ? contentHeight : height;
				setMeasuredChartHeight( chartHeight );
			},
			[ height ]
		);

		// Forward the external ref to the internal ref
		useImperativeHandle(
			ref,
			() => ( {
				getScales: () => internalChartRef.current?.getScales() || null,
				getChartDimensions: () =>
					internalChartRef.current?.getChartDimensions() || { width: 0, height: 0, margin: {} },
			} ),
			[ internalChartRef ]
		);

		const dataSorted = useChartDataTransform( data );
		const { getElementStyles } = useGlobalChartsContext();

		// Series visibility is owned by the provider, so it applies whether it changed
		// through the interactive legend or programmatically.
		const seriesWithVisibility = useMemo( () => {
			return dataSorted.map( ( series, index ) => ( {
				series,
				index,
				isVisible: ! hiddenSeries.has( series.label ),
			} ) );
		}, [ dataSorted, hiddenSeries ] );

		// Check if all series are hidden
		const allSeriesHidden = useMemo( () => {
			return seriesWithVisibility.every( ( { isVisible } ) => ! isVisible );
		}, [ seriesWithVisibility ] );

		// When series visibility changes — via the interactive legend or programmatically —
		// and rescaling is opted out, pin the value axis to the full data range so it stays
		// put instead of visx rescaling the domain to whatever is currently visible and
		// making the axis jump. Default is to rescale, matching the pre-existing behaviour
		// and AreaChart's `rescaleYOnVisibilityChange`.
		const stableYDomain = useMemo< [ number, number ] | undefined >( () => {
			if ( rescaleYOnVisibilityChange ) {
				return undefined;
			}
			let min = Infinity;
			let max = -Infinity;
			for ( const series of dataSorted ) {
				for ( const point of series.data ?? [] ) {
					const value = point?.value;
					if ( typeof value === 'number' && Number.isFinite( value ) ) {
						min = Math.min( min, value );
						max = Math.max( max, value );
					}
				}
			}
			return min < max ? [ min, max ] : undefined;
		}, [ rescaleYOnVisibilityChange, dataSorted ] );

		// Keyboard navigation steps through x positions, and the grouped tooltip
		// reads every series at that position; the first series names the point.
		const activateSelectedPoint = useCallback(
			( index: number ) => {
				const series = dataSorted[ 0 ];
				const datum = series?.data[ index ];

				if ( series && datum ) {
					onDatumActivate?.( { datum, index, key: series.label } );
				}
			},
			[ dataSorted, onDatumActivate ]
		);

		const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: dataSorted[ 0 ]?.data.length || 0,
			onActivate: activateSelectedPoint,
		} );

		const chartOptions = useMemo( () => {
			return {
				axis: {
					x: buildTimeAxisOptions( {
						dataSorted,
						width,
						axisOptions: options?.axis?.x,
						scaleDomain: options?.xScale?.domain as [ Date, Date ] | undefined,
						zoomDomain: zoom.domain as [ Date, Date ] | undefined,
						formatting,
						// A hidden line is unmounted, so visx scales to the rest.
						isSeriesRendered: series => ! hiddenSeries.has( series.label ),
					} ),
					y: {
						orientation: 'left' as const,
						numTicks: 4,
						tickFormat: formatNumberCompact as TickFormatter< number >,
						display: true,
						...options?.axis?.y,
					},
				},
				xScale: {
					type: 'time' as const,
					...options?.xScale,
					...( zoom.domain ? { domain: zoom.domain } : {} ),
				},
				yScale: {
					type: 'linear' as const,
					nice: true,
					zero: false,
					...( stableYDomain ? { domain: stableYDomain } : {} ),
					...options?.yScale,
				},
			};
		}, [ options, dataSorted, width, zoom.domain, stableYDomain, formatting, hiddenSeries ] );

		const bucketInfo = useMemo(
			() => getBucketInfo( dataSorted, options?.axis?.x?.tickResolution ),
			[ dataSorted, options ]
		);

		const tooltipRenderGlyph = useMemo( () => {
			return ( props: GlyphProps< DataPointDate > ) => {
				const seriesIndex = dataSorted.findIndex(
					series =>
						series.label === props.key || series.data.includes( props.datum as DataPointDate )
				);

				const seriesData = dataSorted[ seriesIndex ];

				const { color, glyph: themeGlyph } = getElementStyles( {
					data: seriesData,
					index: seriesIndex,
				} );

				const propsWithResolvedColor = { ...props, color };

				return themeGlyph
					? themeGlyph( propsWithResolvedColor )
					: renderGlyph( propsWithResolvedColor );
			};
		}, [ dataSorted, renderGlyph, getElementStyles ] );

		const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme );

		const error = validateData( dataSorted );
		const isDataValid = ! error;

		// Memoize legend options to prevent unnecessary re-calculations
		const legendOptions = useMemo(
			() => ( {
				withGlyph: withLegendGlyph,
				glyphSize: Math.max( 0, toNumber( glyphStyle?.radius ) ?? 4 ),
				collapseGroups: legendCollapseGroups,
				renderGlyph,
			} ),
			[ withLegendGlyph, glyphStyle?.radius, legendCollapseGroups, renderGlyph ]
		);

		// Create legend items using the reusable hook
		const legendItems = useChartLegendItems( dataSorted, legendOptions, legendShape );

		// Memoize metadata to prevent unnecessary re-registration
		const chartMetadata = useMemo(
			() => ( {
				withGradientFill,
				smoothing,
				curveType,
				withStartGlyphs,
				withEndGlyphs,
				withLegendGlyph,
			} ),
			[ withGradientFill, smoothing, curveType, withStartGlyphs, withEndGlyphs, withLegendGlyph ]
		);

		// Register chart with context only if data is valid
		useChartRegistration( {
			chartId,
			legendItems,
			chartType: 'line',
			isDataValid,
			metadata: chartMetadata,
		} );

		const prefersReducedMotion = usePrefersReducedMotion();

		const accessors = {
			xAccessor: ( d: DataPointDate ) => d?.date,
			yAccessor: ( d: DataPointDate ) => d?.value,
		};

		// Augments every renderTooltip call with the chart's bucket classification,
		// default or custom, so a heading keyed on it can't disagree with the axis.
		const tooltipRenderer = useMemo(
			() => ( params: RenderTooltipParams< DataPointDate > ) =>
				renderTooltip( { ...params, bucketInfo } ),
			[ renderTooltip, bucketInfo ]
		);

		if ( error ) {
			return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
		}

		const legendElement = showLegend && (
			<Legend
				orientation={ legend.orientation ?? 'horizontal' }
				alignment={ legend.alignment ?? 'center' }
				position={ legendPosition }
				labelStyles={ legend.labelStyles }
				itemClassName={ legend.itemClassName }
				itemStyles={ legend.itemStyles }
				shapeStyles={ legend.shapeStyles }
				className={ styles[ 'line-chart__legend' ] }
				shape={ legendShape }
				chartId={ chartId }
				interactive={ legendInteractive }
			/>
		);

		return (
			<ChartInstanceContext.Provider
				value={ {
					chartId,
					chartRef: internalChartRef,
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
						'line-chart',
						styles[ 'line-chart' ],
						{ [ styles[ 'line-chart--animated' ] ]: animation && ! prefersReducedMotion },
						className
					) }
					style={ { width, height } }
					data-testid="line-chart"
					trailingContent={ nonLegendChildren }
					onContentHeightChange={ handleContentHeightChange }
				>
					{ ( { contentHeight } ) => {
						// Use the measured height, falling back to the passed height if provided.
						const chartHeight = contentHeight > 0 ? contentHeight : height;

						return (
							<div
								role="grid"
								aria-label={ __( 'Line chart', 'jetpack-charts' ) }
								tabIndex={ 0 }
								onKeyDown={ onChartKeyDown }
								onFocus={ onChartFocus }
								onBlur={ onChartBlur }
							>
								{ chartHeight > 0 && (
									<div ref={ chartRef } style={ { position: 'relative' } }>
										{ zoomable && zoom.domain && <ZoomResetButton onClick={ zoom.reset } /> }
										<XYChart
											theme={ theme }
											width={ width }
											height={ chartHeight }
											margin={ {
												...defaultMargin,
												...margin,
											} }
											// xScale and yScale could be set in Axis as well, but they are `scale` props there.
											xScale={ chartOptions.xScale }
											yScale={ chartOptions.yScale }
											onPointerDown={ zoom.handlers.onPointerDown }
											onPointerUp={ zoom.handlers.onPointerUp }
											onPointerMove={ zoom.handlers.onPointerMove }
											onPointerOut={ onPointerOut }
											pointerEventsDataKey="nearest"
										>
											{ /* With every series hidden there is no data to scale against, so the grid and
											     axes are dropped while the empty state stands in — otherwise they render
											     squished at the top. */ }
											{ ! allSeriesHidden && gridVisibility !== 'none' && (
												<Grid columns={ false } numTicks={ 4 } />
											) }
											{ ! allSeriesHidden && chartOptions.axis.x.display && (
												<Axis { ...chartOptions.axis.x } />
											) }
											{ ! allSeriesHidden && chartOptions.axis.y.display && (
												<Axis { ...chartOptions.axis.y } />
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

											{ /* Line is not animated, so clip only while zoomed; its edge glyphs sit on the plot border and must not be clipped. */ }
											<ZoomClip active={ zoomable && !! zoom.domain } chartId={ chartId }>
												{ seriesWithVisibility.map(
													( { series: seriesData, index, isVisible } ) => {
														// Skip rendering invisible series
														if ( ! isVisible ) {
															return null;
														}

														const { color, lineStyles, glyph } = getElementStyles( {
															data: seriesData,
															index,
														} );

														const lineProps = {
															stroke: color,
															...lineStyles,
														};

														return (
															<g key={ seriesData?.label || index }>
																{ withGradientFill && (
																	<LinearGradient
																		id={ `area-gradient-${ chartId }-${ index + 1 }` }
																		from={ color }
																		fromOpacity={ 0.4 }
																		toOpacity={ 0.1 }
																		to={ resolvedBackgroundColor }
																		{ ...seriesData.options?.gradient }
																		data-testid="line-gradient"
																	>
																		{ seriesData.options?.gradient?.stops?.map(
																			( stop, stopIndex ) => (
																				<stop
																					key={ `${ stop.offset }-${ stop.color || color }` }
																					offset={ stop.offset }
																					stopColor={ stop.color || color }
																					stopOpacity={ stop.opacity ?? 1 }
																					data-testid={ `line-gradient-stop-${ chartId }-${ index }-${ stopIndex }` }
																				/>
																			)
																		) }
																	</LinearGradient>
																) }
																<AreaSeries
																	key={ seriesData?.label }
																	dataKey={ seriesData?.label }
																	data={ seriesData.data as DataPointDate[] }
																	{ ...accessors }
																	fill={
																		withGradientFill
																			? `url(#area-gradient-${ chartId }-${ index + 1 })`
																			: 'transparent'
																	}
																	renderLine={ true }
																	curve={ getCurveType( curveType, smoothing ) }
																	lineProps={ lineProps }
																/>

																{ withStartGlyphs && (
																	<LineChartGlyph
																		index={ index }
																		data={ seriesData }
																		color={ color }
																		renderGlyph={ glyph ?? renderGlyph }
																		accessors={ accessors }
																		glyphStyle={ glyphStyle }
																		position="start"
																	/>
																) }

																{ withEndGlyphs && (
																	<LineChartGlyph
																		index={ index }
																		data={ seriesData }
																		color={ color }
																		renderGlyph={ glyph ?? renderGlyph }
																		accessors={ accessors }
																		glyphStyle={ glyphStyle }
																		position="end"
																	/>
																) }
															</g>
														);
													}
												) }
											</ZoomClip>

											{ withTooltips && (
												<AccessibleTooltip
													detectBounds
													snapTooltipToDatumX
													snapTooltipToDatumY
													showSeriesGlyphs
													renderTooltip={ tooltipRenderer }
													renderGlyph={ tooltipRenderGlyph }
													glyphStyle={ glyphStyle }
													showVerticalCrosshair={ withTooltipCrosshairs?.showVertical }
													showHorizontalCrosshair={ withTooltipCrosshairs?.showHorizontal }
													selectedIndex={ selectedIndex }
													tooltipRef={ tooltipRef }
													keyboardFocusedClassName={
														styles[ 'line-chart__tooltip--keyboard-focused' ]
													}
													series={ dataSorted }
												/>
											) }

											{ /* Component to expose scale data via ref */ }
											<LineChartScalesRef
												chartRef={ internalChartRef }
												width={ width }
												height={ height }
												margin={ margin }
											/>
											{ zoomable && <ZoomSelectionRect drag={ zoom.drag } /> }
										</XYChart>
									</div>
								) }
							</div>
						);
					} }
				</ChartLayout>
			</ChartInstanceContext.Provider>
		);
	}
);

// Component type definitions for composition API
type LineChartAnnotationComponents = {
	AnnotationsOverlay: typeof LineChartAnnotationsOverlay;
	Annotation: typeof LineChartAnnotation;
	Legend: typeof Legend;
};

type LineChartBaseProps = Optional< LineChartProps, 'width' | 'height' | 'size' >;

type LineChartComponent = React.ForwardRefExoticComponent<
	LineChartBaseProps & React.RefAttributes< ChartInstanceRef >
> &
	LineChartAnnotationComponents;

type LineChartResponsiveComponent = React.ForwardRefExoticComponent<
	LineChartBaseProps & ResponsiveConfig & React.RefAttributes< ChartInstanceRef >
> &
	LineChartAnnotationComponents;

const LineChartWithProvider = forwardRef< ChartInstanceRef, LineChartProps >( ( props, ref ) => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, render the core component directly
	if ( existingContext ) {
		return <LineChartInternal { ...props } ref={ ref } />;
	}

	// Otherwise, wrap with our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<LineChartInternal { ...props } ref={ ref } />
		</GlobalChartsProvider>
	);
} );

LineChartWithProvider.displayName = 'LineChart';

const LineChart = attachSubComponents( LineChartWithProvider, {
	Legend: Legend,
	AnnotationsOverlay: LineChartAnnotationsOverlay,
	Annotation: LineChartAnnotation,
} ) as LineChartComponent;

const LineChartResponsive = attachSubComponents(
	withResponsive< LineChartProps >( LineChartWithProvider ),
	{
		Legend: Legend,
		AnnotationsOverlay: LineChartAnnotationsOverlay,
		Annotation: LineChartAnnotation,
	}
) as LineChartResponsiveComponent;

export { LineChartResponsive as default, LineChart as LineChartUnresponsive };
