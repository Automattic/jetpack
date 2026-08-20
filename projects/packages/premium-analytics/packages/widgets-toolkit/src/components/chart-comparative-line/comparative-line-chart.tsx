/**
 * External dependencies
 */
import { LineChart, Stack, type TickResolution } from '@jetpack-premium-analytics/externals';
import {
	formatDate,
	formatMetricValue,
	type DateFormatName,
} from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { isEmptyChartData, getFixedYAxis, dateFormatForResolution } from '../../helpers';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-line-chart.module.scss';
import { alignSeriesDates } from './utils';
import type { ComparativeLineChartSeries, SeriesStyle } from './types';
import type { DataFormat } from '../../types';

/**
 * Resolves series styles from either the explicit styles prop or series options.
 * Priority: styles prop > series[].options fallback
 *
 * @param stylesFromProp - Explicit styles passed as component prop
 * @param series         - Series data (may contain options with styles)
 * @return Array of resolved styles, one per series
 */
function resolveSeriesStyles(
	stylesFromProp: SeriesStyle[] | undefined,
	series: ComparativeLineChartSeries[]
): SeriesStyle[] {
	if ( stylesFromProp?.length ) {
		return stylesFromProp;
	}

	return series.map( s => {
		const lineStyle = s.options?.seriesLineStyle;

		return {
			stroke: s.options?.stroke ?? '',
			strokeWidth: lineStyle?.strokeWidth,
			strokeDasharray: lineStyle?.strokeDasharray,
			strokeLinecap: lineStyle?.strokeLinecap,
			strokeLinejoin: lineStyle?.strokeLinejoin,
			opacity: lineStyle?.opacity,
		};
	} );
}

/**
 * Default margin for charts.
 * Y-axis is on the left, so right margin is always 0.
 */
const DEFAULT_MARGIN = { right: 0 };

/**
 * Chart-area height (px) below which `compactWhenShort` degrades the chart to
 * a sparkline (no y-axis, grid, or legend).
 */
const COMPACT_CHART_HEIGHT = 140;

function applyStylesToSeries(
	series: ComparativeLineChartSeries[],
	resolvedStyles: SeriesStyle[]
): ComparativeLineChartSeries[] {
	return series.map( ( seriesItem, index ) => {
		const style = resolvedStyles[ index ] ?? resolvedStyles[ 0 ];

		if ( ! style?.stroke ) {
			return seriesItem;
		}

		const { stroke, ...lineStyleProps } = style;

		return {
			...seriesItem,
			options: {
				...( seriesItem.options ?? {} ),
				stroke,
				seriesLineStyle: lineStyleProps,
			},
		};
	} );
}

/**
 * Inferred types
 */
type LineChartProps = ComponentProps< typeof LineChart >;
type RenderTooltipParams = Parameters< NonNullable< LineChartProps[ 'renderTooltip' ] > >[ 0 ];

export type ComparativeLineChartProps = {
	/**
	 * Array of series data to display in the chart.
	 * Series can include styling via options.stroke and options.seriesLineStyle
	 * as a fallback when styles prop is not provided.
	 */
	series: ComparativeLineChartSeries[];

	/**
	 * Explicit styles for each series. When provided, these take priority
	 * over any styles defined in series[].options.
	 * Array index corresponds to series index.
	 */
	styles?: SeriesStyle[];

	className?: string;

	dataFormat: DataFormat;

	/** Named date format for the X-axis ticks. Uses the chart default when omitted. */
	tickFormat?: DateFormatName;

	/**
	 * The series' bucket size. Declaring it lets the automatic tick formatter pick
	 * its regime from a known granularity instead of measuring the gaps between
	 * points, which a single-bucket or DST-shortened series gives it no way to
	 * read. An explicit `tickFormat` still wins over both.
	 */
	tickResolution?: TickResolution;

	/**
	 * Renders a point's date for a tooltip row, in the named format this chart
	 * picked for it. Defaults to reading the date as the instant it is. Callers
	 * whose points are wall clocks rather than instants — Stats buckets, built by
	 * `toChartDate` — pass a variant that re-anchors them first.
	 */
	formatTooltipDate?: ( date: Date, format: DateFormatName ) => string;

	/**
	 * Degrade to a sparkline (no y-axis, grid, or legend) when the chart area
	 * is too short for readable axis labels. Defaults to false.
	 */
	compactWhenShort?: boolean;
} & Omit<
	ComponentProps< typeof LineChart >,
	| 'data'
	| 'options'
	| 'withLegendGlyph'
	| 'smoothing'
	| 'showLegend'
	| 'withGradientFill'
	| 'resizeDebounceTime'
	| 'withTooltips'
	| 'renderTooltip'
>;

export function ComparativeLineChart( {
	series,
	styles: stylesProp,
	className,
	dataFormat,
	tickFormat: xTickFormatType,
	tickResolution,
	formatTooltipDate = formatDate,
	maxWidth = Infinity,
	compactWhenShort = false,
}: ComparativeLineChartProps ) {
	const tooltipDateFormat = dateFormatForResolution( tickResolution );
	// The measured Stack fills its container (flex), so its height is independent
	// of whether the axis/legend are shown — no measure/hide feedback loop.
	const [ chartAreaHeight, setChartAreaHeight ] = useState( Infinity );
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			setChartAreaHeight( rect.height );
		}
	} );
	const isCompact = compactWhenShort && chartAreaHeight < COMPACT_CHART_HEIGHT;
	// Also used for tooltip styling, not only to decorate the series data.
	const resolvedStyles = useMemo< SeriesStyle[] >(
		() => resolveSeriesStyles( stylesProp, series ),
		[ stylesProp, series ]
	);

	// Comparison points sit on the primary series' dates, so the tooltip reads
	// the `realDate` preserved by `alignSeriesDates`.
	const getTooltipLabel = useCallback(
		( datum: { date: Date; realDate?: Date }, index: number ): string => {
			const isComparison = index > 0;
			const displayDate = isComparison ? datum.realDate ?? datum.date : datum.date;

			return formatTooltipDate( displayDate, tooltipDateFormat );
		},
		[ tooltipDateFormat, formatTooltipDate ]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			return (
				<ChartTooltip
					tooltipData={ params.tooltipData }
					dataFormat={ dataFormat }
					seriesStyles={ resolvedStyles }
					indicatorType="line"
					getLabel={ getTooltipLabel }
				/>
			);
		},
		[ dataFormat, resolvedStyles, getTooltipLabel ]
	);

	// Multipliers and no decimals keep the y-axis tick labels short.
	const yTickFormat = useMemo(
		() => ( value: number ) =>
			formatMetricValue( value, dataFormat.type, {
				useMultipliers: true,
				decimals: 0,
			} ),
		[ dataFormat ]
	);

	// Comparison dates are aligned onto the primary series for the X axis; the
	// originals stay in `realDate` for tooltips.
	const alignedSeries = useMemo( () => alignSeriesDates( series ), [ series ] );

	const styledSeries = useMemo( () => {
		// Without a styles prop, the series already carry their styles in options.
		if ( ! stylesProp?.length ) {
			return alignedSeries;
		}
		return applyStylesToSeries( alignedSeries, resolvedStyles );
	}, [ stylesProp, alignedSeries, resolvedStyles ] );

	const isEmptyData = useMemo( () => isEmptyChartData( styledSeries ), [ styledSeries ] );

	// A pinned domain for percentage metrics and all-zero periods, with the left
	// margin its widest tick needs. Null lets the chart scale to the data.
	const fixedYAxis = useMemo(
		() => getFixedYAxis( dataFormat.type, isEmptyData, yTickFormat ),
		[ dataFormat.type, isEmptyData, yTickFormat ]
	);

	const xTickFormat = useCallback(
		( date: number ) => formatDate( date, xTickFormatType ),
		[ xTickFormatType ]
	);

	const chartOptions = useMemo( () => {
		const baseOptions = {
			axis: {
				x: {
					// Must stay conditional: `formatDate` defaults to `medium`, so an
					// unconditional `xTickFormat` would put full site-format dates on every
					// tick. Without the prop, the chart library's own tick labels stay in use.
					tickFormat: xTickFormatType ? xTickFormat : undefined,
					tickResolution,
				},
				y: {
					tickFormat: yTickFormat,
					// Hide the y-axis on short tiles; its labels would otherwise overlap.
					...( isCompact ? { display: false } : {} ),
				},
			},
		};

		if ( ! fixedYAxis ) {
			return baseOptions;
		}

		return { ...baseOptions, yScale: { domain: fixedYAxis.domain } };
	}, [ xTickFormat, xTickFormatType, tickResolution, yTickFormat, fixedYAxis, isCompact ] );

	const margin = fixedYAxis ? { ...DEFAULT_MARGIN, left: fixedYAxis.marginLeft } : DEFAULT_MARGIN;

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<LineChart
				className={ styles.chartContent }
				data={ styledSeries }
				options={ chartOptions }
				// With the y-axis hidden, reclaim its reserved left margin for the line.
				margin={ isCompact ? { ...margin, left: 0 } : margin }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				withLegendGlyph={ false }
				showLegend={ false }
				curveType="monotone"
				withGradientFill
				withTooltips={ !! renderTooltip && ! isEmptyData }
				renderTooltip={ renderTooltip }
			>
				{ /* The solid/dashed lines already convey current vs previous period. */ }
				{ ! isCompact && (
					<LineChart.Legend
						shape="line"
						className={ styles.legend }
						itemClassName={ styles.legendItem }
						itemStyles={ {
							margin: 0,
						} }
						labelClassName={ styles.legendLabel }
						labelStyles={ {
							maxWidth: '100%',
							textOverflow: 'ellipsis',
							margin: 0,
						} }
						shapeStyles={ { margin: 0 } }
					/>
				) }
			</LineChart>
		</Stack>
	);
}
