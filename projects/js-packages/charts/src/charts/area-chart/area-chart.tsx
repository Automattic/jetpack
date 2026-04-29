import { formatNumberCompact, formatNumber } from '@automattic/number-formatters';
import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { scaleTime } from '@visx/scale';
import {
	XYChart,
	AreaSeries,
	AreaStack,
	Grid,
	Axis,
	DataContext,
	TooltipContext,
} from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { differenceInHours, differenceInYears } from 'date-fns';
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
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import styles from './area-chart.module.scss';
import type { AreaChartProps, AreaChartTooltipDatum } from './types';
import type { ElementStyles, GetElementStylesParams } from '../../providers';
import type { DataPoint, DataPointDate, SeriesData, Optional } from '../../types';
import type { CurveType } from '../line-chart/types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { TickFormatter } from '@visx/axis';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, Ref } from 'react';

const X_TICK_WIDTH = 60;

const getCurveType = ( type?: CurveType, smoothing?: boolean ) => {
	if ( ! type ) {
		return smoothing ? curveCatmullRom : curveLinear;
	}

	switch ( type ) {
		case 'smooth':
			return curveCatmullRom;
		case 'monotone':
			return curveMonotoneX;
		case 'linear':
			return curveLinear;
		default:
			return curveLinear;
	}
};

const renderDefaultTooltip = ( params: RenderTooltipParams< DataPointDate > ) => {
	const { tooltipData } = params;
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: AreaChartTooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'area-chart__tooltip' ] }>
			<div className={ styles[ 'area-chart__tooltip-date' ] }>
				{ nearestDatum.date?.toLocaleDateString() }
			</div>
			{ tooltipPoints.map( point => (
				<Stack
					key={ point.key }
					direction="row"
					align="center"
					justify="space-between"
					className={ styles[ 'area-chart__tooltip-row' ] }
				>
					<span className={ styles[ 'area-chart__tooltip-label' ] }>{ point.key }:</span>
					<span className={ styles[ 'area-chart__tooltip-value' ] }>
						{ formatNumber( point.value ) }
					</span>
				</Stack>
			) ) }
		</div>
	);
};

const formatYearTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, { year: 'numeric' } );
};

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, { month: 'short', day: 'numeric' } );
};

const formatHourTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleTimeString( undefined, { hour: 'numeric', hour12: true } );
};

const getFormatter = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	const minX = Math.min( ...sortedData.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...sortedData.map( datom => datom.data.at( -1 )?.date ) );

	const diffInHours = Math.abs( differenceInHours( maxX, minX ) );
	if ( diffInHours <= 24 ) {
		return formatHourTick;
	}

	const diffInYears = Math.abs( differenceInYears( maxX, minX ) );
	if ( diffInYears <= 1 ) {
		return formatDateTick;
	}

	return formatYearTick;
};

const guessOptimalNumTicks = (
	data: ReturnType< typeof useChartDataTransform >,
	chartWidth: number,
	tickFormatter: ( timestamp: number, index?: number, values?: unknown ) => string
) => {
	const minX = Math.min( ...data.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...data.map( datom => datom.data.at( -1 )?.date ) );
	const xScale = scaleTime( { domain: [ minX, maxX ] } );

	const upperBound = Math.min(
		data[ 0 ]?.data.length || 3,
		Math.ceil( chartWidth / X_TICK_WIDTH )
	);
	let secondBestGuess = 1;

	for ( let numTicks = upperBound; numTicks > 1; --numTicks ) {
		const ticks = xScale.ticks( numTicks ).map( d => tickFormatter( d.getTime() ) );

		if ( ticks.length > upperBound ) continue;

		secondBestGuess = Math.max( secondBestGuess, ticks.length );

		const uniqueTicks = Array.from( new Set( ticks ) );
		if ( uniqueTicks.length === 1 ) return 1;

		const hasConsecutiveDuplicate = ticks.some(
			( tick, idx ) => idx > 0 && tick === ticks[ idx - 1 ]
		);
		if ( hasConsecutiveDuplicate ) continue;

		return ticks.length;
	}

	return secondBestGuess;
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

const AreaChartScalesRef: FC< {
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
				if ( ! context?.xScale || ! context?.yScale ) return null;
				return { xScale: context.xScale, yScale: context.yScale };
			},
			getChartDimensions: () => ( { width, height, margin: margin || {} } ),
		} ),
		[ context, width, height, margin ]
	);

	return null;
};

type VisibleSeriesEntry = { series: SeriesData; index: number; isVisible: boolean };

// SVG overlay rendering a circle at each visible series for the currently
// hovered x-position. visx's `showSeriesGlyphs` doesn't work for AreaStack
// (registered yAccessor expects a stack-bar but receives the unwrapped
// DataPointDate, returning NaN), so glyph positions are computed from the
// chart's own scales. Stacked + offset='none' renders at the cumulative top
// edge; other stack offsets are skipped (would need to re-run the d3-stack
// layout). Unstacked renders at the series' raw y-value.
const HoverGlyphs: FC< {
	visibleSeries: VisibleSeriesEntry[];
	stacked: boolean;
	stackOffset: 'none' | 'expand' | 'wiggle' | 'silhouette';
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
} > = ( { visibleSeries, stacked, stackOffset, getElementStyles } ) => {
	const dataContext = useContext( DataContext );
	const tooltipContext = useContext( TooltipContext );

	const xScale = dataContext?.xScale;
	const yScale = dataContext?.yScale;
	const tooltipOpen = tooltipContext?.tooltipOpen;
	const nearestDatum = tooltipContext?.tooltipData?.nearestDatum?.datum as
		| DataPointDate
		| undefined;
	const themeBg =
		( dataContext?.theme as { backgroundColor?: string } | undefined )?.backgroundColor ?? '#fff';

	if (
		! tooltipOpen ||
		! xScale ||
		! yScale ||
		! nearestDatum ||
		! nearestDatum.date ||
		( stacked && stackOffset !== 'none' )
	) {
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const xPx = Number( ( xScale as any )( nearestDatum.date ) );
	if ( ! Number.isFinite( xPx ) ) return null;

	const hoveredTime = nearestDatum.date.getTime();
	let cumulative = 0;
	const circles = visibleSeries
		.map( ( { series, index } ) => {
			const datum = series.data.find(
				d => ( d as DataPointDate ).date?.getTime() === hoveredTime
			) as DataPointDate | undefined;
			if ( ! datum || datum.value == null ) return null;

			const yValue = stacked ? ( cumulative += datum.value ) : datum.value;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const yPx = Number( ( yScale as any )( yValue ) );
			if ( ! Number.isFinite( yPx ) ) return null;

			const { color } = getElementStyles( { data: series, index } );

			return (
				<circle
					key={ series.label || index }
					cx={ xPx }
					cy={ yPx }
					r={ 4 }
					fill={ color }
					stroke={ themeBg }
					strokeWidth={ 1.5 }
					paintOrder="fill"
					data-testid={ `area-chart-hover-glyph-${ index }` }
				/>
			);
		} )
		.filter( Boolean );

	if ( circles.length === 0 ) return null;

	return (
		<g pointerEvents="none" className="area-chart__hover-glyphs">
			{ circles }
		</g>
	);
};

const AreaChartInternal = forwardRef< SingleChartRef, AreaChartProps >(
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
			stacked = true,
			stackOffset = 'none',
			smoothing = true,
			curveType,
			fillOpacity,
			withStroke,
			renderTooltip = renderDefaultTooltip,
			animation,
			options = {},
			onPointerDown,
			onPointerUp,
			onPointerMove,
			onPointerOut,
			children,
			gridVisibility,
			gap = 'md',
		},
		ref
	) => {
		const legendInteractive = legend.interactive ?? false;
		const legendShape = legend.shape ?? 'rect';
		const legendPosition = legend.position ?? 'bottom';

		const theme = useXYChartTheme( data );
		const chartId = useChartId( providedChartId );
		const chartRef = useRef< HTMLDivElement >( null );
		const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
		const [ isNavigating, setIsNavigating ] = useState( false );
		const internalChartRef = useRef< SingleChartRef >( null );

		const { legendChildren, nonLegendChildren } = useChartChildren( children, 'AreaChart' );
		const [ measuredChartHeight, setMeasuredChartHeight ] = useState< number | undefined >();

		const handleContentHeightChange = useCallback(
			( contentHeight: number ) => {
				const chartHeight = contentHeight > 0 ? contentHeight : height;
				setMeasuredChartHeight( chartHeight );
			},
			[ height ]
		);

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

		const allSeriesHidden = useMemo(
			() => seriesWithVisibility.every( ( { isVisible } ) => ! isVisible ),
			[ seriesWithVisibility ]
		);

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
				},
				yScale: {
					type: 'linear' as const,
					nice: true,
					// Stacked areas should always include zero so the baseline is meaningful.
					zero: stacked,
					...options?.yScale,
				},
			};
		}, [ options, dataSorted, width, stacked ] );

		const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme );

		const error = validateData( dataSorted );
		const isDataValid = ! error;

		const legendOptions = useMemo( () => ( { withGlyph: false, glyphSize: 0 } ), [] );
		const legendItems = useChartLegendItems( dataSorted, legendOptions, legendShape );

		const chartMetadata = useMemo(
			() => ( { stacked, stackOffset, smoothing, curveType } ),
			[ stacked, stackOffset, smoothing, curveType ]
		);

		useChartRegistration( {
			chartId,
			legendItems,
			chartType: 'area',
			isDataValid,
			metadata: chartMetadata,
		} );

		const prefersReducedMotion = usePrefersReducedMotion();

		const accessors = {
			xAccessor: ( d: DataPointDate ) => d?.date,
			yAccessor: ( d: DataPointDate ) => d?.value,
		};

		// Defaults that depend on stacked vs overlapping mode.
		const resolvedFillOpacity = fillOpacity ?? ( stacked ? 0.85 : 0.4 );
		const resolvedWithStroke = withStroke ?? ! stacked;

		if ( error ) {
			return <div className={ clsx( 'area-chart', styles[ 'area-chart' ] ) }>{ error }</div>;
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
				className={ styles[ 'area-chart__legend' ] }
				shape={ legendShape }
				chartId={ chartId }
				interactive={ legendInteractive }
			/>
		);

		const visibleSeries = seriesWithVisibility.filter( ( { isVisible } ) => isVisible );
		const curve = getCurveType( curveType, smoothing );

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
						'area-chart',
						styles[ 'area-chart' ],
						{ [ styles[ 'area-chart--animated' ] ]: animation && ! prefersReducedMotion },
						className
					) }
					style={ { width, height } }
					data-testid="area-chart"
					trailingContent={ nonLegendChildren }
					onContentHeightChange={ handleContentHeightChange }
				>
					{ ( { contentHeight } ) => {
						const chartHeight = contentHeight > 0 ? contentHeight : height;

						return (
							<div
								role="grid"
								aria-label={ __( 'Area chart', 'jetpack-charts' ) }
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
											margin={ { ...defaultMargin, ...margin } }
											xScale={ chartOptions.xScale }
											yScale={ chartOptions.yScale }
											onPointerDown={ onPointerDown }
											onPointerUp={ onPointerUp }
											onPointerMove={ onPointerMove }
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

											{ ! allSeriesHidden && stacked && (
												<AreaStack
													curve={ curve }
													offset={ stackOffset }
													renderLine={ resolvedWithStroke }
												>
													{ visibleSeries.map( ( { series: seriesData, index } ) => {
														const { color, lineStyles } = getElementStyles( {
															data: seriesData,
															index,
														} );

														return (
															<AreaSeries
																key={ seriesData?.label || index }
																dataKey={ seriesData?.label }
																data={ seriesData.data as DataPointDate[] }
																{ ...accessors }
																fill={ color }
																fillOpacity={ resolvedFillOpacity }
																lineProps={ {
																	stroke: color,
																	...lineStyles,
																} }
																data-testid={ `area-chart-series-${ index }` }
															/>
														);
													} ) }
												</AreaStack>
											) }

											{ ! allSeriesHidden &&
												! stacked &&
												visibleSeries.map( ( { series: seriesData, index } ) => {
													const { color, lineStyles } = getElementStyles( {
														data: seriesData,
														index,
													} );

													return (
														<AreaSeries
															key={ seriesData?.label || index }
															dataKey={ seriesData?.label }
															data={ seriesData.data as DataPointDate[] }
															{ ...accessors }
															fill={ color }
															fillOpacity={ resolvedFillOpacity }
															renderLine={ resolvedWithStroke }
															curve={ curve }
															lineProps={ {
																stroke: color,
																...lineStyles,
															} }
															data-testid={ `area-chart-series-${ index }` }
														/>
													);
												} ) }

											{ withTooltips && (
												<>
													<AccessibleTooltip
														detectBounds
														snapTooltipToDatumX
														snapTooltipToDatumY
														renderTooltip={ renderTooltip }
														showVerticalCrosshair={ withTooltipCrosshairs?.showVertical }
														showHorizontalCrosshair={ withTooltipCrosshairs?.showHorizontal }
														selectedIndex={ selectedIndex }
														tooltipRef={ tooltipRef }
														series={ dataSorted }
													/>
													<HoverGlyphs
														visibleSeries={ visibleSeries }
														stacked={ stacked }
														stackOffset={ stackOffset }
														getElementStyles={ getElementStyles }
													/>
												</>
											) }

											<AreaChartScalesRef
												chartRef={ internalChartRef }
												width={ width }
												height={ height }
												margin={ margin }
											/>
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

type AreaChartSubComponents = {
	Legend: typeof Legend;
};

type AreaChartBaseProps = Optional< AreaChartProps, 'width' | 'height' | 'size' >;

type AreaChartComponent = React.ForwardRefExoticComponent<
	AreaChartBaseProps & React.RefAttributes< SingleChartRef >
> &
	AreaChartSubComponents;

type AreaChartResponsiveComponent = React.ForwardRefExoticComponent<
	AreaChartBaseProps & ResponsiveConfig & React.RefAttributes< SingleChartRef >
> &
	AreaChartSubComponents;

const AreaChartWithProvider = forwardRef< SingleChartRef, AreaChartProps >( ( props, ref ) => {
	const existingContext = useContext( GlobalChartsContext );

	if ( existingContext ) {
		return <AreaChartInternal { ...props } ref={ ref } />;
	}

	return (
		<GlobalChartsProvider>
			<AreaChartInternal { ...props } ref={ ref } />
		</GlobalChartsProvider>
	);
} );

AreaChartWithProvider.displayName = 'AreaChart';

const AreaChart = attachSubComponents( AreaChartWithProvider, {
	Legend: Legend,
} ) as AreaChartComponent;

const AreaChartResponsive = attachSubComponents(
	withResponsive< AreaChartProps >( AreaChartWithProvider ),
	{
		Legend: Legend,
	}
) as AreaChartResponsiveComponent;

export { AreaChartResponsive as default, AreaChart as AreaChartUnresponsive };
