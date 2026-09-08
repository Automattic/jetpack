/**
 * External dependencies
 */
import {
	LineChart,
	Stack,
	getBucketInfo,
	type TickResolution,
} from '@jetpack-premium-analytics/externals';
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
import {
	formatTooltipSeriesLabel,
	isEmptyChartData,
	getFixedYAxis,
	dateFormatForResolution,
	resolveSeriesNames,
} from '../../helpers';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-line-chart.module.scss';
import { alignSeriesDates } from './utils';
import type { ComparativeLineChartSeries, SeriesStyle } from './types';
import type { DataFormat } from '../../types';

/** Series styles, with the explicit `styles` prop taking priority over `series[].options`. */
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

/** The y-axis is on the left, so the right margin is always 0. */
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

type LineChartProps = ComponentProps< typeof LineChart >;
type RenderTooltipParams = Parameters< NonNullable< LineChartProps[ 'renderTooltip' ] > >[ 0 ];

export type ComparativeLineChartProps = {
	/** A series may carry its own `options.stroke` / `options.seriesLineStyle` as a fallback. */
	series: ComparativeLineChartSeries[];

	/** Styles by series index; these win over anything in `series[].options`. */
	styles?: SeriesStyle[];

	className?: string;

	dataFormat: DataFormat;

	/** Named date format for the X-axis ticks. Uses the chart default when omitted. */
	tickFormat?: DateFormatName;

	/**
	 * The series' bucket size. Declaring it lets the automatic tick formatter read its
	 * regime from a known granularity rather than the gaps between points, which a
	 * single-bucket or DST-shortened series makes unreadable.
	 */
	tickResolution?: TickResolution;

	/**
	 * Renders a point's date for a tooltip row, in the named format this chart
	 * picked for it. Defaults to `formatDate`.
	 */
	formatTooltipDate?: ( date: Date, format: DateFormatName ) => string;

	/**
	 * Degrade to a sparkline (no y-axis, grid, or legend) when the chart area is too
	 * short for readable axis labels.
	 */
	compactWhenShort?: boolean;

	/**
	 * Let the reader click legend items to show and hide series. Off by default:
	 * a chart drawing one metric has nothing to compare, and its periods collapse
	 * into a single item, so clicking it would just empty the chart.
	 */
	legendInteractive?: boolean;
} & Omit<
	ComponentProps< typeof LineChart >,
	| 'data'
	| 'options'
	| 'legend'
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
	chartId,
	dataFormat,
	tickFormat: xTickFormatType,
	tickResolution,
	formatTooltipDate = formatDate,
	maxWidth = Infinity,
	compactWhenShort = false,
	defaultHiddenSeries,
	legendInteractive = false,
	onPointerDown,
	onPointerUp,
	onDatumActivate,
}: ComparativeLineChartProps ) {
	const tooltipDateFormat = dateFormatForResolution(
		getBucketInfo( series, tickResolution ).displayResolution
	);
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

	const { seriesNames, isPaired } = useMemo( () => resolveSeriesNames( series ), [ series ] );
	// A legend item names a metric; the solid mark against its previous-period twin is
	// what tells the periods apart, so a metric's two periods always collapse into one.
	const legendConfig = useMemo(
		() => ( { collapseGroups: true, interactive: legendInteractive } ),
		[ legendInteractive ]
	);

	// Comparison points share the primary series' dates, so the tooltip reads back
	// `realDate`; multi-metric charts also prefix each row so two rows don't share a date.
	const getTooltipLabel = useCallback(
		( datum: { date: Date; realDate?: Date }, _index: number, key: string ): string => {
			const name = seriesNames.get( key );
			const displayDate = datum.realDate ?? datum.date;
			const date = formatTooltipDate( displayDate, tooltipDateFormat );
			// Without a name the row would otherwise lead with an internal label,
			// so fall back to the date, which is always meaningful.
			return isPaired && name ? formatTooltipSeriesLabel( name, date ) : date;
		},
		[ seriesNames, isPaired, formatTooltipDate, tooltipDateFormat ]
	);

	// `resolvedStyles` follows `series`; the tooltip's rows need not, so pair them
	// by key (see `ChartTooltip`'s `seriesKeys`).
	const seriesKeys = useMemo( () => series.map( item => item.label ), [ series ] );

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			return (
				<ChartTooltip
					tooltipData={ params.tooltipData }
					dataFormat={ dataFormat }
					seriesStyles={ resolvedStyles }
					seriesKeys={ seriesKeys }
					indicatorType="line"
					getLabel={ getTooltipLabel }
				/>
			);
		},
		[ dataFormat, resolvedStyles, seriesKeys, getTooltipLabel ]
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
					// Must stay conditional: `formatDate` defaults to `medium`, so passing
					// `xTickFormat` unconditionally puts full dates on every tick.
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
				chartId={ chartId }
				className={ styles.chartContent }
				data={ styledSeries }
				options={ chartOptions }
				defaultHiddenSeries={ defaultHiddenSeries }
				legend={ legendConfig }
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
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onDatumActivate={ onDatumActivate }
			>
				{ /* Names the metrics; the solid line against its dashed overlay is what
				     tells the current period from the previous one. */ }
				{ ! isCompact && (
					<LineChart.Legend
						interactive={ legendInteractive }
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
