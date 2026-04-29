import { formatNumberCompact } from '@automattic/number-formatters';
import { XYChart, AreaSeries, AreaStack, Grid, Axis } from '@visx/xychart';
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
import { attachSubComponents } from '../../utils';
import { renderDefaultTooltip } from '../line-chart';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import styles from './area-chart.module.scss';
import {
	AreaChartScalesRef,
	HoverGlyphs,
	getCurveType,
	getFormatter,
	guessOptimalNumTicks,
	validateData,
} from './private';
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
														// Stacked mode: yAccessor returns raw value, not stacked y — snapping mispositions.
														snapTooltipToDatumY={ ! stacked }
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
														strokeColor={ providerTheme.backgroundColor }
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
