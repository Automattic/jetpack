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
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers';
import { attachSubComponents, resolveCssVariable } from '../../utils';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { DefaultGlyph } from '../private/default-glyph';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { getCurveType, getFormatter, guessOptimalNumTicks } from '../private/time-axis';
import { withResponsive } from '../private/with-responsive';
import { useXZoom, ZoomResetButton, ZoomSelectionRect, ZoomClip } from '../private/x-zoom';
import styles from './line-chart.module.scss';
import { LineChartAnnotation, LineChartAnnotationsOverlay, LineChartGlyph } from './private';
import type { RenderLineGlyphProps, LineChartProps, TooltipDatum } from './types';
import type { DataPoint, DataPointDate, SeriesData, Optional } from '../../types';
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

/**
 * Default visx-tooltip render that prints the hovered date as a heading and
 * one row per visible series (label + formatted value), sorted descending by
 * value. Reused by AreaChart, which has the same multi-series shape.
 *
 * @param params - visx `RenderTooltipParams< DataPointDate >`.
 * @return Tooltip JSX, or `null` when no datum is hovered.
 */
export const renderDefaultTooltip = ( params: RenderTooltipParams< DataPointDate > ) => {
	const { tooltipData } = params;
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
				{ nearestDatum.date?.toLocaleDateString() }
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
	chartRef?: Ref< SingleChartRef >;
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

const LineChartInternal = forwardRef< SingleChartRef, LineChartProps >(
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
			zoomable = false,
			children,
			gridVisibility,
			gap = 'md',
		},
		ref
	) => {
		const legendInteractive = legend.interactive ?? false;
		const legendShape = legend.shape ?? 'line';
		const legendPosition = legend.position ?? 'bottom';

		const providerTheme = useGlobalChartsTheme();
		// Gradient stops apply this as an SVG attribute, where CSS var() cannot
		// resolve, so resolve the WPDS token to a concrete value first.
		const resolvedBackgroundColor =
			resolveCssVariable( providerTheme.backgroundColor ) ?? providerTheme.backgroundColor;
		const theme = useXYChartTheme( data );
		const chartId = useChartId( providedChartId );
		const chartRef = useRef< HTMLDivElement >( null );
		const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
		const [ isNavigating, setIsNavigating ] = useState( false );
		const internalChartRef = useRef< SingleChartRef >( null );

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
		const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

		// Add visibility information to series when using interactive legends
		const seriesWithVisibility = useMemo( () => {
			if ( ! chartId || ! legendInteractive ) {
				return dataSorted.map( ( series, index ) => ( { series, index, isVisible: true } ) );
			}
			return dataSorted.map( ( series, index ) => ( {
				series,
				index,
				isVisible: isSeriesVisible( chartId, series.label ),
			} ) );
		}, [ dataSorted, chartId, isSeriesVisible, legendInteractive ] );

		// Check if all series are hidden
		const allSeriesHidden = useMemo( () => {
			return seriesWithVisibility.every( ( { isVisible } ) => ! isVisible );
		}, [ seriesWithVisibility ] );

		// Use the keyboard navigation hook
		const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: dataSorted[ 0 ]?.data.length || 0,
		} );

		const chartOptions = useMemo( () => {
			const formatter = options?.axis?.x?.tickFormat || getFormatter( dataSorted );

			return {
				axis: {
					x: {
						orientation: 'bottom' as const,
						numTicks: guessOptimalNumTicks( dataSorted, width, formatter ),
						tickFormat: formatter,
						display: true,
						...options?.axis?.x,
					},
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
					...options?.yScale,
				},
			};
		}, [ options, dataSorted, width, zoom.domain ] );

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
				renderGlyph,
			} ),
			[ withLegendGlyph, glyphStyle?.radius, renderGlyph ]
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

		// Create a custom renderTooltip that includes focus capability
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
			<SingleChartContext.Provider
				value={ {
					chartId,
					chartRef: internalChartRef,
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
											{ gridVisibility !== 'none' && <Grid columns={ false } numTicks={ 4 } /> }
											{ chartOptions.axis.x.display && <Axis { ...chartOptions.axis.x } /> }
											{ chartOptions.axis.y.display && <Axis { ...chartOptions.axis.y } /> }

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
													renderTooltip={ renderTooltip }
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
			</SingleChartContext.Provider>
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
	LineChartBaseProps & React.RefAttributes< SingleChartRef >
> &
	LineChartAnnotationComponents;

type LineChartResponsiveComponent = React.ForwardRefExoticComponent<
	LineChartBaseProps & ResponsiveConfig & React.RefAttributes< SingleChartRef >
> &
	LineChartAnnotationComponents;

const LineChartWithProvider = forwardRef< SingleChartRef, LineChartProps >( ( props, ref ) => {
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
