/**
 * External dependencies
 */
import {
	BarChart,
	Stack,
	useGlobalChartsContext,
	type TickResolution,
} from '@jetpack-premium-analytics/externals';
import {
	formatDate,
	formatMetricValue,
	type DateFormatName,
} from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useId, useMemo, useState } from 'react';
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
import { alignSeriesDates } from '../chart-comparative-line/utils';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-bar-chart.module.scss';
import type { ComparativeBarChartSeries } from './types';
import type { DataFormat } from '../../types';
import type { ComparativeDatePointDate } from '../chart-comparative-line/types';
import type { TooltipStyle } from '../chart-tooltip';
import type { ComponentProps } from 'react';

/**
 * Default margin for charts.
 * Y-axis is on the left, so right margin is always 0.
 */
const DEFAULT_MARGIN = { right: 0 };

/**
 * Chart-area height (px) below which `compactWhenShort` degrades the chart to
 * a sparkline (no y-axis, grid, or legend). Matches the comparative line chart
 * so a metric switching chart type keeps the same breakpoint.
 */
const COMPACT_CHART_HEIGHT = 140;

/**
 * Inferred types from BarChart.
 */
type BarChartProps = ComponentProps< typeof BarChart >;
type RenderTooltipParams = Parameters< NonNullable< BarChartProps[ 'renderTooltip' ] > >[ 0 ];

/**
 * Props for the ComparativeBarChart component.
 *
 * Deliberately mirrors `ComparativeLineChartProps` so a consumer can swap the
 * two on one flag without reshaping its data. The one difference is that there
 * is no `styles` prop — see the component docblock for why.
 */
export type ComparativeBarChartProps = {
	/**
	 * Series to draw. A series marked `options.type: 'comparison'` renders as
	 * the previous-period shadow behind its same-`group` primary series.
	 */
	series: ComparativeBarChartSeries[];

	/**
	 * CSS class for the chart container.
	 */
	className?: string;

	/**
	 * Format configuration for chart values (Y-axis ticks and tooltips).
	 */
	dataFormat: DataFormat;

	/** Named date format for the X-axis ticks. Uses the chart default when omitted. */
	tickFormat?: DateFormatName;

	/**
	 * The series' bucket size. Declaring it lets the automatic tick formatter pick
	 * its regime from a known granularity instead of measuring the gaps between
	 * points, which a single-bucket or DST-shortened series gives it no way to
	 * read. An explicit `tickFormat` still wins over both. The tooltip reads it
	 * too, to decide whether a date alone identifies a bucket.
	 */
	tickResolution?: TickResolution;

	/**
	 * Renders a point's date for a tooltip row, in the named format this chart
	 * picked for it. Callers whose points are wall clocks (see `chart-date.ts`)
	 * pass a variant that re-anchors them first; defaults to `formatDate`.
	 */
	formatTooltipDate?: ( date: Date, format: DateFormatName ) => string;

	/**
	 * Degrade to a sparkline (no y-axis, grid, or legend) when the chart area
	 * is too short for readable axis labels. Defaults to false.
	 */
	compactWhenShort?: boolean;

	/**
	 * Maximum chart width. Passed through to the underlying chart.
	 */
	maxWidth?: number;

	/**
	 * Chart identity the charts provider keys visibility on. Generated when
	 * omitted; supply one that changes whenever `defaultHiddenSeries` should be
	 * applied again.
	 */
	chartId?: string;

	/**
	 * Labels of the series to hide until the reader reveals them. Applied once
	 * per `chartId`.
	 */
	defaultHiddenSeries?: readonly string[];

	/**
	 * Let the reader click legend items to show and hide series. Off by default:
	 * a chart drawing one metric has nothing to compare, and its periods collapse
	 * into a single item, so clicking it would just empty the chart.
	 */
	legendInteractive?: boolean;

	/**
	 * Pointer-down on the plot, carrying the datum nearest the pointer.
	 */
	onPointerDown?: BarChartProps[ 'onPointerDown' ];

	/**
	 * Pointer-up on the plot, carrying the datum nearest the pointer.
	 */
	onPointerUp?: BarChartProps[ 'onPointerUp' ];

	/**
	 * Enter or Space on the keyboard-selected bar, carrying its datum.
	 */
	onDatumActivate?: BarChartProps[ 'onDatumActivate' ];
};

/**
 * A date-keyed bar chart with previous-period comparison, built on
 * `@automattic/charts` `BarChart`.
 *
 * Bar styling is left to the charts theme rather than passed in: the comparison
 * shadow's geometry is driven by the theme's `barStyles.widthFactor`, so
 * overriding fills here would decouple the shadow from the bar it shadows.
 * Colours are read back through `getElementStyles` only to tint the tooltip
 * swatches, matching what the chart drew. Reading the theme means this must be
 * rendered inside a `GlobalChartsProvider`, unlike `ComparativeLineChart`.
 *
 * @param {ComparativeBarChartProps} props - The component props.
 * @return The rendered chart.
 */
export function ComparativeBarChart( {
	series,
	className,
	chartId: providedChartId,
	dataFormat,
	tickFormat: xTickFormatType,
	tickResolution,
	formatTooltipDate = formatDate,
	compactWhenShort = false,
	maxWidth = Infinity,
	defaultHiddenSeries,
	legendInteractive = false,
	onPointerDown,
	onPointerUp,
	onDatumActivate,
}: ComparativeBarChartProps ) {
	const tooltipDateFormat = dateFormatForResolution( tickResolution );
	const fallbackChartId = useId();
	const chartId = providedChartId ?? fallbackChartId;
	const { getElementStyles } = useGlobalChartsContext();

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

	/**
	 * Align comparison series dates to the primary series so both land in the
	 * same band slot. Original dates are preserved in `realDate` for tooltips.
	 */
	const alignedSeries = useMemo( () => alignSeriesDates( series ), [ series ] );

	const isEmptyData = useMemo( () => isEmptyChartData( alignedSeries ), [ alignedSeries ] );

	/**
	 * Tooltip swatches, resolved from the chart theme so they match the bars the
	 * chart drew. The opacity matters: a comparison series shares its primary's
	 * colour and is set apart only by the theme dimming it, so a swatch without
	 * it renders the previous period as an identical twin of the current one.
	 */
	const seriesStyles = useMemo< TooltipStyle[] >(
		() =>
			alignedSeries.map( ( seriesData, index ) => {
				const { color, barStyles } = getElementStyles( { data: seriesData, index } );
				return { stroke: color, opacity: barStyles?.opacity };
			} ),
		[ alignedSeries, getElementStyles ]
	);

	/**
	 * Y-axis formatter using dataFormat configuration, but with multipliers and
	 * 0 decimals to keep tick strings short.
	 */
	const yTickFormat = useMemo(
		() => ( value: number ) =>
			formatMetricValue( value, dataFormat.type, {
				useMultipliers: true,
				decimals: 0,
			} ),
		[ dataFormat ]
	);

	// With no declared format, `undefined` hands the axis to the chart's derived
	// date formatter; `formatDate`'s `medium` default would otherwise put full
	// site-format dates on every tick.
	const xTickFormat = useMemo(
		() => ( xTickFormatType ? ( date: number ) => formatDate( date, xTickFormatType ) : undefined ),
		[ xTickFormatType ]
	);

	const { primaryByGroup, seriesNames, isPaired } = useMemo(
		() => resolveSeriesNames( series ),
		[ series ]
	);
	// A legend item names a metric; the solid mark against its previous-period
	// twin is what tells the periods apart. So a metric's two periods always
	// collapse into one item, whether or not a counterpart shares the chart.
	const legendConfig = useMemo(
		() => ( { collapseGroups: true, interactive: legendInteractive } ),
		[ legendInteractive ]
	);

	/**
	 * Label a tooltip row by its point's own date. Comparison points carry the
	 * primary series' date for axis alignment, so read `realDate` when present
	 * or the row would repeat the current period's date. A chart handed more than
	 * one metric prefixes every row with its metric: dates alone would name two
	 * rows the same as soon as the reader reveals the counterpart.
	 */
	const getTooltipLabel = useCallback(
		( datum: { date?: Date; realDate?: Date }, _index: number, key: string ): string => {
			const displayDate = datum.realDate ?? datum.date;
			if ( ! displayDate ) {
				return key;
			}
			const name = seriesNames.get( key );
			const date = formatTooltipDate( displayDate, tooltipDateFormat );
			// Without a name the row would otherwise lead with an internal label,
			// so fall back to the date, which is always meaningful.
			return isPaired && name ? formatTooltipSeriesLabel( name, date ) : date;
		},
		[ seriesNames, isPaired, formatTooltipDate, tooltipDateFormat ]
	);

	/**
	 * Re-attach the hovered category's previous-period value to the tooltip data.
	 *
	 * The bar chart draws comparison series as a separate shadow layer and hands
	 * its tooltip only the primary series, so a datum for the previous period
	 * never reaches a custom renderer. Its own default tooltip compensates by
	 * looking the pair up, but supplying `renderTooltip` replaces that default
	 * outright — without this the shadow bar would be visible while its value
	 * stayed unreadable, including to screen readers. The line chart needs no
	 * equivalent: it passes every series to its tooltip.
	 *
	 * @param tooltipData - The tooltip data from the chart.
	 * @return The same data with a previous-period entry appended when one exists.
	 */
	const withComparisonDatum = useCallback(
		( tooltipData: RenderTooltipParams[ 'tooltipData' ] ) => {
			const datumByKey = tooltipData?.datumByKey;
			const hovered = tooltipData?.nearestDatum?.datum as ComparativeDatePointDate | undefined;

			if ( ! datumByKey || ! hovered?.date ) {
				return tooltipData;
			}

			const hoveredTime = hovered.date.getTime();
			const augmented = { ...datumByKey };

			for ( const [ index, seriesData ] of alignedSeries.entries() ) {
				if ( seriesData.options?.type !== 'comparison' || augmented[ seriesData.label ] ) {
					continue;
				}

				// A hidden metric contributes no bar, so its group's current period is
				// absent here. Re-adding its shadow would put a series the reader chose
				// not to see back in the tooltip.
				const primaryLabel =
					seriesData.group !== undefined ? primaryByGroup.get( seriesData.group ) : undefined;
				if ( primaryLabel && ! datumByKey[ primaryLabel ] ) {
					continue;
				}

				// Comparison dates were aligned onto the primary axis, so the hovered
				// category matches on `date`; `realDate` still carries the true one and
				// is what `getTooltipLabel` shows.
				const paired = seriesData.data.find( point => point.date?.getTime() === hoveredTime );

				if ( paired?.value != null ) {
					augmented[ seriesData.label ] = { datum: paired, index, key: seriesData.label };
				}
			}

			return { ...tooltipData, datumByKey: augmented };
		},
		[ alignedSeries, primaryByGroup ]
	);

	// `seriesStyles` follows `alignedSeries`; the tooltip's rows do not, so pair
	// them by key (see `ChartTooltip`'s `seriesKeys`).
	const seriesKeys = useMemo( () => alignedSeries.map( item => item.label ), [ alignedSeries ] );

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => (
			<ChartTooltip
				tooltipData={ withComparisonDatum( params.tooltipData ) }
				dataFormat={ dataFormat }
				seriesStyles={ seriesStyles }
				seriesKeys={ seriesKeys }
				indicatorType="rect"
				getLabel={ getTooltipLabel }
			/>
		),
		[ dataFormat, seriesStyles, seriesKeys, getTooltipLabel, withComparisonDatum ]
	);

	/**
	 * A pinned domain for percentage metrics and all-zero periods, with the left
	 * margin its widest tick needs. Null lets the chart scale to the data.
	 */
	const fixedYAxis = useMemo(
		() => getFixedYAxis( dataFormat.type, isEmptyData, yTickFormat ),
		[ dataFormat.type, isEmptyData, yTickFormat ]
	);

	const chartOptions = useMemo( () => {
		const baseOptions = {
			axis: {
				x: {
					tickFormat: xTickFormat,
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
	}, [ xTickFormat, tickResolution, yTickFormat, isCompact, fixedYAxis ] );

	const margin = useMemo( () => {
		// With the y-axis hidden, reclaim its reserved left margin for the bars.
		if ( isCompact ) {
			return { ...DEFAULT_MARGIN, left: 0 };
		}

		return fixedYAxis ? { ...DEFAULT_MARGIN, left: fixedYAxis.marginLeft } : DEFAULT_MARGIN;
	}, [ isCompact, fixedYAxis ] );

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<BarChart
				chartId={ chartId }
				className={ styles.chartContent }
				data={ alignedSeries }
				options={ chartOptions }
				defaultHiddenSeries={ defaultHiddenSeries }
				// Paired metrics collapse each current/comparison group into one item;
				// single-metric charts retain their two period labels.
				legend={ legendConfig }
				margin={ margin }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				// A zero-value bar has no height, so a quiet day would otherwise read as
				// missing data. This draws it as a hairline stub instead.
				showZeroValues
				showLegend={ false }
				withTooltips={ ! isEmptyData }
				renderTooltip={ renderTooltip }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onDatumActivate={ onDatumActivate }
			>
				{ /* Circle swatches, not the bar's own shape: the legend only needs to name
				     the metrics — the solid bar against its translucent shadow is what
				     tells the periods apart in the chart itself. */ }
				{ ! isCompact && (
					<BarChart.Legend
						interactive={ legendInteractive }
						shape="circle"
						className={ styles.legend }
						itemClassName={ styles.legendItem }
						itemStyles={ { margin: 0 } }
						labelClassName={ styles.legendLabel }
						labelStyles={ {
							maxWidth: '100%',
							textOverflow: 'ellipsis',
							margin: 0,
						} }
						shapeStyles={ { width: 8, height: 8, margin: 0 } }
					/>
				) }
			</BarChart>
		</Stack>
	);
}
