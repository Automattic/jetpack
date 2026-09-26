/**
 * External dependencies
 */
import {
	LineChart,
	Stack,
	getBucketInfo,
	useGlobalChartsContext,
	type TickResolution,
} from '@jetpack-premium-analytics/externals';
import { formatDate, type DateFormatName } from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useId, useMemo, useState } from 'react';
import { type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import {
	appendTooltipExtras,
	formatTooltipPointLabel,
	isEmptyChartData,
	getFixedYAxis,
	getPaddedYAxis,
	getPinnedYTicks,
	getYTickFormat,
	dateFormatForResolution,
	resolveTooltipUnits,
} from '../../helpers';
import { useLockedPrimaryLegendItems } from '../../hooks/use-locked-primary-legend-items';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-line-chart.module.scss';
import { alignSeriesDates } from './utils';
import type { ComparativeLineChartSeries, SeriesStyle, TooltipExtraSeries } from './types';
import type { ChartBaseline } from '../../helpers';
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
	 * Let the reader click legend items to show and hide series; the first item stays
	 * locked so the chart is never emptied. Off by default: a chart drawing one metric
	 * has nothing to compare.
	 */
	legendInteractive?: boolean;

	/**
	 * Series the tooltip reads out but the chart does not draw; see
	 * `TooltipExtraSeries` for what listing one changes about the rows.
	 */
	tooltipExtras?: TooltipExtraSeries[];

	/**
	 * Where the value axis starts. `zero` (the default) suits a per-period metric;
	 * `padded` keeps a cumulative count's small changes visible. A percentage
	 * metric and an all-zero period pin their own axis either way.
	 */
	baseline?: ChartBaseline;
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
	tooltipExtras,
	baseline = 'zero',
	onPointerDown,
	onPointerUp,
	onDatumActivate,
}: ComparativeLineChartProps ) {
	const tooltipDateFormat = dateFormatForResolution(
		getBucketInfo( series, tickResolution ).displayResolution
	);
	const fallbackChartId = useId();
	const resolvedChartId = chartId ?? fallbackChartId;
	const { getHiddenSeries } = useGlobalChartsContext();
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

	// A metric's two periods collapse into one item; a single static Comparison period
	// item explains the dashed overlay instead.
	const legendConfig = useMemo(
		() => ( { collapseGroups: true, comparisonItem: true, interactive: legendInteractive } ),
		[ legendInteractive ]
	);

	const tooltipUnits = useMemo(
		() => resolveTooltipUnits( series, tooltipExtras ),
		[ series, tooltipExtras ]
	);

	// Comparison points share the primary series' dates, so the tooltip reads back
	// `realDate`.
	const getTooltipLabel = useCallback(
		(
			datum: { date: Date; realDate?: Date },
			_index: number,
			key: string,
			value: string | null,
			rawValue: number | null
		): string => {
			const displayDate = datum.realDate ?? datum.date;
			const date = formatTooltipDate( displayDate, tooltipDateFormat );
			const unit = tooltipUnits.get( key );
			return formatTooltipPointLabel( value, unit?.name ?? key, date, rawValue, unit?.countLabel );
		},
		[ tooltipUnits, formatTooltipDate, tooltipDateFormat ]
	);

	// `resolvedStyles` follows `series`; the tooltip's rows need not, so pair them
	// by key (see `ChartTooltip`'s `seriesKeys`).
	const seriesKeys = useMemo( () => series.map( item => item.label ), [ series ] );

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			const { tooltipData, supplementaryRows } = appendTooltipExtras(
				params.tooltipData,
				tooltipExtras
			);

			return (
				<ChartTooltip
					tooltipData={ tooltipData }
					dataFormat={ dataFormat }
					seriesStyles={ resolvedStyles }
					seriesKeys={ seriesKeys }
					indicatorType="line"
					layout="inline"
					supplementaryRows={ supplementaryRows }
					getLabel={ getTooltipLabel }
				/>
			);
		},
		[ dataFormat, resolvedStyles, seriesKeys, getTooltipLabel, tooltipExtras ]
	);

	const alignedSeries = useMemo( () => alignSeriesDates( series ), [ series ] );

	const styledSeries = useMemo( () => {
		// Without a styles prop, the series already carry their styles in options.
		if ( ! stylesProp?.length ) {
			return alignedSeries;
		}
		return applyStylesToSeries( alignedSeries, resolvedStyles );
	}, [ stylesProp, alignedSeries, resolvedStyles ] );

	const legendItems = useLockedPrimaryLegendItems( styledSeries, legendConfig, 'line' );

	const isEmptyData = useMemo( () => isEmptyChartData( styledSeries ), [ styledSeries ] );
	// An all-zero selected metric must not hide the extras that do have data.
	const hasTooltipRows = useMemo(
		() => ! isEmptyData || ! isEmptyChartData( tooltipExtras ?? [] ),
		[ isEmptyData, tooltipExtras ]
	);

	// A percentage metric or an all-zero period pins its own axis; otherwise a
	// padded baseline pads what the legend leaves visible. Null lets the chart fit
	// the data above zero.
	const pinnedYAxis = useMemo( () => {
		const fixedYAxis = getFixedYAxis( dataFormat.type, isEmptyData );
		if ( fixedYAxis || baseline !== 'padded' ) {
			return fixedYAxis;
		}
		const hiddenSeries = getHiddenSeries( resolvedChartId );
		return getPaddedYAxis( styledSeries.filter( s => ! hiddenSeries.has( s.label ) ) );
	}, [ dataFormat.type, isEmptyData, baseline, styledSeries, getHiddenSeries, resolvedChartId ] );

	// Pinned ticks let the label format see exactly what the axis draws.
	const yTicks = useMemo(
		() => ( pinnedYAxis ? getPinnedYTicks( pinnedYAxis.domain ) : undefined ),
		[ pinnedYAxis ]
	);
	const yTickFormat = useMemo(
		() => getYTickFormat( dataFormat.type, yTicks ),
		[ dataFormat.type, yTicks ]
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
					...( yTicks ? { tickValues: yTicks } : {} ),
					// Hide the y-axis on short tiles; its labels would otherwise overlap.
					...( isCompact ? { display: false } : {} ),
				},
			},
		};

		if ( pinnedYAxis ) {
			return { ...baseOptions, yScale: { domain: pinnedYAxis.domain } };
		}

		// `zero` rather than a domain, so hiding a series still rescales the axis.
		return { ...baseOptions, yScale: { zero: true } };
	}, [
		xTickFormat,
		xTickFormatType,
		tickResolution,
		yTickFormat,
		yTicks,
		pinnedYAxis,
		isCompact,
	] );

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<LineChart
				chartId={ resolvedChartId }
				className={ styles.chartContent }
				data={ styledSeries }
				options={ chartOptions }
				defaultHiddenSeries={ defaultHiddenSeries }
				legend={ legendConfig }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				withLegendGlyph={ false }
				showLegend={ false }
				curveType="monotone"
				withGradientFill
				withTooltips={ !! renderTooltip && hasTooltipRows }
				renderTooltip={ renderTooltip }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onDatumActivate={ onDatumActivate }
			>
				{ ! isCompact && (
					<LineChart.Legend
						items={ legendItems }
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
