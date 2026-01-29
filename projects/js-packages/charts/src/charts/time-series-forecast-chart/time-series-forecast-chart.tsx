import { formatNumberCompact, formatNumber } from '@automattic/number-formatters';
import { curveMonotoneX } from '@visx/curve';
import { XYChart, AreaSeries, Grid, Axis, Tooltip } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useContext, useMemo, useCallback } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { useXYChartTheme, useElementHeight, usePrefersReducedMotion } from '../../hooks';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	useChartId,
	useGlobalChartsTheme,
} from '../../providers';
import { withResponsive } from '../private/with-responsive';
import { ForecastDivider, useForecastData } from './private';
import styles from './time-series-forecast-chart.module.scss';
import type {
	TimeSeriesForecastChartProps,
	TransformedForecastPoint,
	BandPoint,
	SeriesKeys,
} from './types';
import type { BaseLegendItem } from '../../components/legend';
import type { Optional } from '../../types';
import type { TickFormatter } from '@visx/axis';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC } from 'react';

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

const DEFAULT_SERIES_KEYS: Required< SeriesKeys > = {
	historical: __( 'Historical', 'jetpack-charts' ),
	forecast: __( 'Forecast', 'jetpack-charts' ),
	band: __( 'Uncertainty', 'jetpack-charts' ),
};

const formatDateTick = ( d: Date ) => {
	return d.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

/**
 * Internal component that renders the TimeSeriesForecastChart
 *
 * @param root0                - Component props
 * @param root0.data           - Array of data points to display
 * @param root0.accessors      - Accessor functions to extract values from data
 * @param root0.forecastStart  - Date at which forecast begins
 * @param root0.height         - Chart height in pixels
 * @param root0.width          - Chart width in pixels
 * @param root0.margin         - Chart margin configuration
 * @param root0.yDomain        - Optional fixed y-axis domain
 * @param root0.xTickFormat    - Formatter function for x-axis ticks
 * @param root0.yTickFormat    - Formatter function for y-axis ticks
 * @param root0.showTooltip    - Whether to show tooltips on hover
 * @param root0.seriesKeys     - Custom labels for series in legend/tooltip
 * @param root0.renderTooltip  - Custom tooltip renderer function
 * @param root0.className      - Additional CSS class name
 * @param root0.chartId        - Unique chart identifier
 * @param root0.showLegend     - Whether to show the legend
 * @param root0.legendPosition - Position of the legend (top or bottom)
 * @param root0.animation      - Whether to enable chart animations
 * @param root0.gridVisibility - Which grid lines to show (x, y, xy, or none)
 * @return The rendered chart component
 */
function TimeSeriesForecastChartInternal< D >( {
	data,
	accessors,
	forecastStart,
	height,
	width = 600,
	margin,
	yDomain: providedYDomain,
	xTickFormat = formatDateTick,
	yTickFormat,
	showTooltip = true,
	seriesKeys: providedSeriesKeys,
	renderTooltip,
	className,
	chartId: providedChartId,
	showLegend = false,
	legendPosition = 'bottom',
	animation = false,
	gridVisibility = 'y',
}: TimeSeriesForecastChartProps< D > ) {
	const providerTheme = useGlobalChartsTheme();
	const chartId = useChartId( providedChartId );
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
	const prefersReducedMotion = usePrefersReducedMotion();

	// Merge series keys with defaults
	const seriesKeys = useMemo(
		() => ( {
			...DEFAULT_SERIES_KEYS,
			...providedSeriesKeys,
		} ),
		[ providedSeriesKeys ]
	);

	// Transform and split data
	const {
		historical,
		forecast,
		bandData,
		yDomain: computedYDomain,
		xDomain,
	} = useForecastData( {
		data,
		accessors,
		forecastStart,
	} );

	// Use provided y domain or computed one
	const yDomain = providedYDomain ?? computedYDomain;

	// Get theme colors
	const primaryColor = providerTheme.colors[ 0 ] ?? '#3858e9';
	const bandColor = providerTheme.colors[ 1 ] ?? primaryColor;

	// Create mock series data for theme hook
	const mockSeriesData = useMemo(
		() => [
			{ label: seriesKeys.historical, data: [] },
			{ label: seriesKeys.forecast, data: [] },
		],
		[ seriesKeys ]
	);
	const theme = useXYChartTheme( mockSeriesData );

	// Computed margin
	const computedMargin = useMemo(
		() => ( {
			...DEFAULT_MARGIN,
			...margin,
		} ),
		[ margin ]
	);

	// Chart dimensions accounting for legend
	const chartHeight = height - ( showLegend ? legendHeight : 0 );

	// Create legend items
	const legendItems = useMemo< BaseLegendItem[] >( () => {
		const items: BaseLegendItem[] = [];

		if ( historical.length > 0 ) {
			items.push( {
				label: seriesKeys.historical,
				value: '',
				color: primaryColor,
			} );
		}

		if ( forecast.length > 0 ) {
			items.push( {
				label: seriesKeys.forecast,
				value: '',
				color: primaryColor,
				shapeStyle: { strokeDasharray: '5 5' },
			} );
		}

		return items;
	}, [ historical.length, forecast.length, seriesKeys, primaryColor ] );

	// Use legend hook for consistent styling
	useChartLegendItems( mockSeriesData, {}, 'line' );

	// Accessors for transformed points (memoized to avoid recreating on each render)
	const xAccessor = useCallback( ( p: TransformedForecastPoint | BandPoint ) => p.date, [] );
	const yAccessor = useCallback( ( p: TransformedForecastPoint ) => p.value, [] );
	const bandUpperAccessor = useCallback( ( p: BandPoint ) => p.upper, [] );
	const bandLowerAccessor = useCallback( ( p: BandPoint ) => p.lower, [] );

	// Default tooltip renderer (memoized to avoid recreating on each render)
	const defaultRenderTooltip = useCallback(
		( params: RenderTooltipParams< TransformedForecastPoint > ) => {
			const { tooltipData } = params;
			const nearestDatum = tooltipData?.nearestDatum?.datum;

			if ( ! nearestDatum ) {
				return null;
			}

			const isForecast = nearestDatum.date.getTime() >= forecastStart.getTime();
			const hasBounds = nearestDatum.lower !== null && nearestDatum.upper !== null;

			return (
				<div className={ styles[ 'time-series-forecast-chart__tooltip' ] }>
					<div className={ styles[ 'time-series-forecast-chart__tooltip-header' ] }>
						{ xTickFormat( nearestDatum.date ) }
						{ isForecast && (
							<span className={ styles[ 'time-series-forecast-chart__forecast-badge' ] }>
								{ seriesKeys.forecast }
							</span>
						) }
					</div>
					<div className={ styles[ 'time-series-forecast-chart__tooltip-row' ] }>
						<span>{ __( 'Value', 'jetpack-charts' ) }:</span>
						<span>{ formatNumber( nearestDatum.value ) }</span>
					</div>
					{ isForecast && hasBounds && (
						<div className={ styles[ 'time-series-forecast-chart__tooltip-row' ] }>
							<span>{ __( 'Range', 'jetpack-charts' ) }:</span>
							<span>
								{ formatNumber( nearestDatum.lower as number ) } -{ ' ' }
								{ formatNumber( nearestDatum.upper as number ) }
							</span>
						</div>
					) }
				</div>
			);
		},
		[ forecastStart, seriesKeys.forecast, xTickFormat ]
	);

	// Custom tooltip renderer that wraps user-provided function
	const tooltipRenderer = useMemo( () => {
		if ( renderTooltip ) {
			return ( params: RenderTooltipParams< TransformedForecastPoint > ) => {
				const nearestDatum = params.tooltipData?.nearestDatum?.datum;
				if ( ! nearestDatum ) return null;

				// originalIndex refers to the position in the original data array (before sorting),
				// so this correctly retrieves the user's original datum for custom tooltip rendering
				const originalDatum = data[ nearestDatum.originalIndex ];
				const isForecast = nearestDatum.date.getTime() >= forecastStart.getTime();

				return renderTooltip( {
					nearest: originalDatum,
					x: nearestDatum.date,
					y: nearestDatum.value,
					yLower: nearestDatum.lower ?? undefined,
					yUpper: nearestDatum.upper ?? undefined,
					isForecast,
				} );
			};
		}
		return defaultRenderTooltip;
	}, [ renderTooltip, data, forecastStart, defaultRenderTooltip ] );

	// Y-axis tick formatter
	const yAxisTickFormat = useMemo( () => {
		if ( yTickFormat ) {
			return yTickFormat as TickFormatter< number >;
		}
		return formatNumberCompact as TickFormatter< number >;
	}, [ yTickFormat ] );

	// X-axis tick formatter - use directly without wrapper
	const xAxisTickFormat = xTickFormat;

	// Handle empty data
	if ( data.length === 0 ) {
		return (
			<div
				className={ clsx(
					'time-series-forecast-chart',
					styles[ 'time-series-forecast-chart' ],
					className
				) }
				data-testid="time-series-forecast-chart"
			>
				{ __( 'No data available', 'jetpack-charts' ) }
			</div>
		);
	}

	// Determine if we should show the divider
	const showDivider = forecast.length > 0 && historical.length > 0;

	// Determine grid settings
	const showXGrid = gridVisibility === 'x' || gridVisibility === 'xy';
	const showYGrid = gridVisibility === 'y' || gridVisibility === 'xy';

	return (
		<div
			className={ clsx(
				'time-series-forecast-chart',
				styles[ 'time-series-forecast-chart' ],
				{
					[ styles[ 'time-series-forecast-chart--animated' ] ]: animation && ! prefersReducedMotion,
					[ styles[ 'time-series-forecast-chart--legend-top' ] ]:
						showLegend && legendPosition === 'top',
				},
				className
			) }
			data-testid="time-series-forecast-chart"
			style={ { width, height } }
		>
			<XYChart
				theme={ theme }
				width={ width }
				height={ chartHeight }
				margin={ computedMargin }
				xScale={ { type: 'time', domain: xDomain } }
				yScale={ { type: 'linear', domain: yDomain, nice: true } }
				pointerEventsDataKey="nearest"
			>
				{ gridVisibility !== 'none' && (
					<Grid columns={ showXGrid } rows={ showYGrid } numTicks={ 4 } />
				) }

				<Axis orientation="bottom" numTicks={ 5 } tickFormat={ xAxisTickFormat } />
				<Axis orientation="left" numTicks={ 4 } tickFormat={ yAxisTickFormat } />

				{ /* Uncertainty band - rendered first (behind lines) */ }
				{ bandData.length > 0 && (
					<AreaSeries
						dataKey={ seriesKeys.band }
						data={ bandData }
						xAccessor={ xAccessor }
						yAccessor={ bandUpperAccessor }
						y0Accessor={ bandLowerAccessor }
						fill={ bandColor }
						fillOpacity={ 0.2 }
						renderLine={ false }
						curve={ curveMonotoneX }
					/>
				) }

				{ /* Historical line - solid */ }
				{ historical.length > 0 && (
					<AreaSeries
						dataKey={ seriesKeys.historical }
						data={ historical }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						fill="transparent"
						renderLine={ true }
						curve={ curveMonotoneX }
						lineProps={ { stroke: primaryColor } }
					/>
				) }

				{ /* Forecast line - dashed */ }
				{ forecast.length > 0 && (
					<AreaSeries
						dataKey={ seriesKeys.forecast }
						data={ forecast }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						fill="transparent"
						renderLine={ true }
						curve={ curveMonotoneX }
						lineProps={ {
							stroke: primaryColor,
							strokeDasharray: '5 5',
						} }
					/>
				) }

				{ /* Vertical divider at forecast start */ }
				{ showDivider && (
					<ForecastDivider
						forecastStart={ forecastStart }
						color={ providerTheme.gridStyles?.stroke ?? '#cccccc' }
					/>
				) }

				{ /* Tooltip */ }
				{ showTooltip && (
					<Tooltip
						snapTooltipToDatumX
						snapTooltipToDatumY
						showSeriesGlyphs
						renderTooltip={ tooltipRenderer }
					/>
				) }
			</XYChart>

			{ showLegend && (
				<Legend
					orientation="horizontal"
					alignment="center"
					position={ legendPosition }
					className={ styles[ 'time-series-forecast-chart__legend' ] }
					shape="line"
					chartId={ chartId }
					ref={ legendRef }
					items={ legendItems }
				/>
			) }
		</div>
	);
}

/**
 * TimeSeriesForecastChart with GlobalChartsProvider wrapper.
 * Automatically wraps with provider if not already in one.
 *
 * @param props - Chart component props
 * @return The rendered chart component with provider context
 */
function TimeSeriesForecastChartWithProvider< D >(
	props: TimeSeriesForecastChartProps< D >
): JSX.Element {
	const existingContext = useContext( GlobalChartsContext );

	if ( existingContext ) {
		return <TimeSeriesForecastChartInternal { ...props } />;
	}

	return (
		<GlobalChartsProvider>
			<TimeSeriesForecastChartInternal { ...props } />
		</GlobalChartsProvider>
	);
}

/**
 * TimeSeriesForecastChart - Displays historical data and forecasts with uncertainty bands
 *
 * Features:
 * - Historical series rendered as a solid line
 * - Forecast series rendered as a dashed line
 * - Uncertainty band (shaded area) between upper/lower bounds
 * - Vertical divider at the forecast start date
 * - Generic data type support via accessors
 */
const TimeSeriesForecastChart = withResponsive(
	TimeSeriesForecastChartWithProvider as FC< TimeSeriesForecastChartProps< unknown > >
) as < D >(
	props: Optional< TimeSeriesForecastChartProps< D >, 'width' | 'height' > & {
		maxWidth?: number;
		aspectRatio?: number;
		resizeDebounceTime?: number;
	}
) => JSX.Element;

/**
 * Non-responsive version of TimeSeriesForecastChart
 * Requires explicit width and height props
 */
const TimeSeriesForecastChartUnresponsive = TimeSeriesForecastChartWithProvider as < D >(
	props: TimeSeriesForecastChartProps< D >
) => JSX.Element;

export { TimeSeriesForecastChart as default, TimeSeriesForecastChartUnresponsive };
