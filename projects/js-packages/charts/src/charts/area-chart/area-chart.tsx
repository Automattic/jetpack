import { formatNumberCompact } from '@automattic/number-formatters';
import { XYChart, AnimatedAreaSeries, AnimatedAreaStack, Grid, Axis } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
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
import { renderDefaultTooltip } from '../line-chart';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { getCurveType, getFormatter, guessOptimalNumTicks } from '../private/time-axis';
import { withResponsive } from '../private/with-responsive';
import { useXZoom, ZoomResetButton, ZoomSelectionRect, ZoomClip } from '../private/x-zoom';
import styles from './area-chart.module.scss';
import { AreaChartScalesRef, HoverGlyphs, validateData } from './private';
import type { AreaChartProps } from './types';
import type { DataPointDate, Optional } from '../../types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { TickFormatter } from '@visx/axis';

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
			zoomable = false,
			rescaleYOnLegendToggle = true,
			children,
			gridVisibility,
			gap = 'md',
		},
		ref
	) => {
		const legendInteractive = legend.interactive ?? false;
		const legendShape = legend.shape ?? 'rect';
		const legendPosition = legend.position ?? 'bottom';

		const providerTheme = useGlobalChartsTheme();
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

		// Computed from the full data set (ignoring legend visibility) so the y-axis stays
		// fixed when series are toggled off - otherwise visx auto-fits to the remaining
		// data and the chart's baseline appears to move. Opt-in via
		// `rescaleYOnLegendToggle={ false }`. Skipped for non-default stack offsets,
		// which reshape the y-extent (`expand` -> [0,1], `wiggle`/`silhouette` -> centred
		// around zero); letting visx derive the domain is correct there.
		const fixedYDomain = useMemo< [ number, number ] | undefined >( () => {
			if (
				rescaleYOnLegendToggle ||
				! legendInteractive ||
				! dataSorted.length ||
				! dataSorted[ 0 ].data.length ||
				( stacked && stackOffset !== 'none' )
			) {
				return undefined;
			}

			if ( stacked ) {
				// d3-stack with `offset: 'none'` stacks positives upward from 0 and
				// negatives downward from 0, so we need both extremes.
				const numPoints = Math.max( ...dataSorted.map( s => s.data.length ) );
				let posMax = 0;
				let negMin = 0;
				for ( let i = 0; i < numPoints; i++ ) {
					let posSum = 0;
					let negSum = 0;
					for ( const series of dataSorted ) {
						const v = Number( series.data[ i ]?.value );
						if ( Number.isNaN( v ) ) continue;
						if ( v >= 0 ) posSum += v;
						else negSum += v;
					}
					if ( posSum > posMax ) posMax = posSum;
					if ( negSum < negMin ) negMin = negSum;
				}
				return [ negMin, posMax ];
			}

			let max = -Infinity;
			let min = Infinity;
			for ( const series of dataSorted ) {
				for ( const point of series.data ) {
					const v = Number( point?.value );
					if ( ! Number.isNaN( v ) ) {
						if ( v > max ) max = v;
						if ( v < min ) min = v;
					}
				}
			}
			if ( max === -Infinity ) return undefined;
			return [ Math.min( 0, min ), max ];
		}, [ dataSorted, stacked, stackOffset, legendInteractive, rescaleYOnLegendToggle ] );

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
					// Stacked areas should always include zero so the baseline is meaningful.
					zero: stacked,
					...( fixedYDomain ? { domain: fixedYDomain } : {} ),
					...options?.yScale,
				},
			};
		}, [ options, dataSorted, width, stacked, fixedYDomain, zoom.domain ] );

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
		const animationEnabled = !! animation && ! prefersReducedMotion;

		const accessors = {
			xAccessor: ( d: DataPointDate ) => d?.date,
			yAccessor: ( d: DataPointDate ) => d?.value,
		};
		const zeroYAccessor = useCallback( () => 0, [] );

		// Hidden series are still registered with visx (so paths can interpolate), but their
		// data points should not appear in the tooltip.
		const visibleLabels = useMemo(
			() => new Set( seriesWithVisibility.filter( s => s.isVisible ).map( s => s.series.label ) ),
			[ seriesWithVisibility ]
		);
		const filteredRenderTooltip = useCallback(
			( params: Parameters< typeof renderTooltip >[ 0 ] ) => {
				if ( ! legendInteractive ) return renderTooltip( params );
				const datumByKey = params?.tooltipData?.datumByKey;
				if ( ! datumByKey ) return renderTooltip( params );
				const filtered = Object.fromEntries(
					Object.entries( datumByKey ).filter( ( [ key ] ) => visibleLabels.has( key ) )
				);
				if ( Object.keys( filtered ).length === 0 ) return null;
				// `nearestDatum` may still point at a hidden series; re-point it at the first
				// visible entry so consumers that read it (e.g. for the tooltip heading) don't
				// surface hidden-series state.
				const nearestDatum = params?.tooltipData?.nearestDatum;
				const nextNearest =
					nearestDatum && visibleLabels.has( nearestDatum.key )
						? nearestDatum
						: { ...Object.values( filtered )[ 0 ], distance: nearestDatum?.distance ?? 0 };
				return renderTooltip( {
					...params,
					tooltipData: {
						...params.tooltipData,
						datumByKey: filtered,
						nearestDatum: nextNearest,
					} as typeof params.tooltipData,
				} );
			},
			[ renderTooltip, legendInteractive, visibleLabels ]
		);

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

		// Visx's `<AreaStack>` keys each `<Area>` by `stackIndex-dataKey`, so filtering out
		// a hidden series would shift indexes and remount every path. Instead we keep every
		// series mounted and zero out hidden ones via `yAccessor` — react-spring then
		// interpolates the `d` attribute, giving a smooth "going down" effect for the
		// hidden area and a smooth re-flow for the rest.
		const renderSeries = ( {
			series: seriesData,
			index,
			isVisible,
		}: ( typeof seriesWithVisibility )[ number ] ) => {
			const { color, lineStyles } = getElementStyles( { data: seriesData, index } );
			return (
				<AnimatedAreaSeries
					key={ seriesData?.label || index }
					dataKey={ seriesData?.label }
					data={ seriesData.data as DataPointDate[] }
					xAccessor={ accessors.xAccessor }
					yAccessor={ isVisible || ! legendInteractive ? accessors.yAccessor : zeroYAccessor }
					fill={ color }
					fillOpacity={ resolvedFillOpacity }
					{ ...( stacked ? {} : { renderLine: resolvedWithStroke, curve } ) }
					lineProps={ { stroke: color, ...lineStyles } }
					data-testid={ `area-chart-series-${ index }` }
				/>
			);
		};

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
						{ [ styles[ 'area-chart--animated' ] ]: animationEnabled },
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
									<div ref={ chartRef } style={ { position: 'relative' } }>
										{ zoomable && zoom.domain && <ZoomResetButton onClick={ zoom.reset } /> }
										<XYChart
											theme={ theme }
											width={ width }
											height={ chartHeight }
											margin={ { ...defaultMargin, ...margin } }
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

											{ /* Area is animated, so clip the whole time it is zoomable to keep the zoom-out animation in bounds. */ }
											<ZoomClip active={ zoomable } chartId={ chartId }>
												{ ! allSeriesHidden && stacked && (
													<AnimatedAreaStack
														curve={ curve }
														offset={ stackOffset }
														renderLine={ resolvedWithStroke }
													>
														{ seriesWithVisibility.map( renderSeries ) }
													</AnimatedAreaStack>
												) }
												{ ! allSeriesHidden &&
													! stacked &&
													seriesWithVisibility.map( renderSeries ) }
											</ZoomClip>

											{ withTooltips && (
												<>
													<AccessibleTooltip
														detectBounds
														snapTooltipToDatumX
														// Stacked mode: yAccessor returns raw value, not stacked y — snapping mispositions.
														snapTooltipToDatumY={ ! stacked }
														renderTooltip={ filteredRenderTooltip }
														showVerticalCrosshair={ withTooltipCrosshairs?.showVertical }
														showHorizontalCrosshair={ withTooltipCrosshairs?.showHorizontal }
														selectedIndex={ selectedIndex }
														tooltipRef={ tooltipRef }
														keyboardFocusedClassName={
															styles[ 'area-chart__tooltip--keyboard-focused' ]
														}
														series={ dataSorted }
													/>
													<HoverGlyphs
														visibleSeries={ visibleSeries }
														stacked={ stacked }
														stackOffset={ stackOffset }
														getElementStyles={ getElementStyles }
														strokeColor={
															resolveCssVariable( providerTheme.backgroundColor ) ??
															providerTheme.backgroundColor
														}
													/>
												</>
											) }

											<AreaChartScalesRef
												chartRef={ internalChartRef }
												width={ width }
												// `||` — responsive HOC may pass `height = 0` before measurement.
												height={ height || chartHeight }
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
