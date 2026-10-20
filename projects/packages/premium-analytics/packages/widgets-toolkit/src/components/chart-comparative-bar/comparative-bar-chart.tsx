/**
 * External dependencies
 */
import {
	BarChart,
	Stack,
	getBucketInfo,
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
	isEmptyChartData,
	formatChartName,
	getFixedYAxis,
	formatBucketTooltipDate,
} from '../../helpers';
import { resolvePrimarySeriesByGroup } from '../../helpers/resolve-series-names';
import { useComparativeLegend } from '../../hooks/use-comparative-legend';
import { alignSeriesDates } from '../chart-comparative-line/utils';
import { DatedTooltip, buildDatedTooltipModel } from '../chart-tooltip';
import styles from './comparative-bar-chart.module.scss';
import type { ComparativeBarChartSeries } from './types';
import type { DataFormat } from '../../types';
import type { ComparativeDatePointDate, TooltipExtraSeries } from '../chart-comparative-line/types';
import type { TooltipStyle } from '../chart-tooltip';
import type { ComponentProps } from 'react';

/**
 * Chart-area height (px) below which `compactWhenShort` degrades the chart to
 * a sparkline (no axes, grid, or legend). Matches the comparative line chart
 * so a metric switching chart type keeps the same breakpoint.
 */
const COMPACT_CHART_HEIGHT = 140;

type BarChartProps = ComponentProps< typeof BarChart >;
type RenderTooltipParams = Parameters< NonNullable< BarChartProps[ 'renderTooltip' ] > >[ 0 ];

/**
 * Deliberately mirrors `ComparativeLineChartProps` so a consumer can swap the two
 * on one flag without reshaping its data. There is no `styles` prop — see below.
 */
export type ComparativeBarChartProps = {
	/**
	 * Series to draw. A series marked `options.type: 'comparison'` renders as
	 * the previous-period shadow behind its same-`group` primary series, or in the
	 * previous period's slot when `overlayGroup` slots the bars.
	 */
	series: ComparativeBarChartSeries[];

	className?: string;

	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle?: string;

	/** Format for chart values: y-axis ticks and tooltips. */
	dataFormat: DataFormat;

	/** Named date format for the X-axis ticks. Uses the chart default when omitted. */
	tickFormat?: DateFormatName;

	/**
	 * The series' bucket size. Declaring it lets the tick formatter pick its regime
	 * from a known granularity instead of measuring the gaps between points, which a
	 * single-bucket or DST-shortened series gives it no way to read.
	 */
	tickResolution?: TickResolution;

	/**
	 * Degrade to a sparkline (no axes, grid, or legend) when the chart area
	 * is too short for readable axis labels. Defaults to false.
	 */
	compactWhenShort?: boolean;

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
	 * Let the reader click legend items to show and hide series; the first item stays
	 * locked so the chart is never emptied. Off by default: a chart drawing one metric
	 * has nothing to compare.
	 */
	legendInteractive?: boolean;

	/**
	 * Names the comparison in each metric's previous-period legend item, e.g.
	 * "Prev. 30 days". Defaults to "Previous period".
	 */
	comparisonLabel?: string;

	/**
	 * Series the tooltip reads out but the chart does not draw; see
	 * `TooltipExtraSeries` for what listing one changes about the rows.
	 */
	tooltipExtras?: TooltipExtraSeries[];

	/**
	 * Give each period one slot, with this group's bar in front of the other groups' bars;
	 * the previous period's slot sits beside the current one. The bars behind take the theme's comparison style.
	 */
	overlayGroup?: string;

	/** Each group's previous-period color, applied only while `overlayGroup` slots the bars. */
	previousStrokes?: Record< string, string >;

	/** Pointer-down on the plot, carrying the datum nearest the pointer. */
	onPointerDown?: BarChartProps[ 'onPointerDown' ];

	/** Pointer-up on the plot, carrying the datum nearest the pointer. */
	onPointerUp?: BarChartProps[ 'onPointerUp' ];

	/** Enter or Space on the keyboard-selected bar, carrying its datum. */
	onDatumActivate?: BarChartProps[ 'onDatumActivate' ];
};

/**
 * Whether a series draws a previous period.
 *
 * @param item - The series.
 * @return Whether it is a previous period.
 */
function isPreviousPeriod( item: ComparativeBarChartSeries ): boolean {
	return item.options?.type === 'comparison';
}

const PREVIOUS_SLOT = 'previous';

/**
 * Regroups the series by period: each period takes one slot, with the front group as its primary
 * and the other groups as comparisons behind it.
 *
 * @param series          - The aligned series.
 * @param frontGroup      - The group drawn in front.
 * @param colorOf         - Each series' color before regrouping, which the palette assigns by group.
 * @param previousStrokes - Each group's previous-period color, overriding the series' own.
 * @return The series as the bar chart draws them.
 */
function toPeriodSlots(
	series: ComparativeBarChartSeries[],
	frontGroup: string,
	colorOf: ( item: ComparativeBarChartSeries, index: number ) => string,
	previousStrokes: Record< string, string > = {}
): ComparativeBarChartSeries[] {
	return series.map( ( item, index ) => {
		const isPrevious = isPreviousPeriod( item );
		const isFront = item.group === frontGroup;
		const previousStroke =
			isPrevious && item.group !== undefined ? previousStrokes[ item.group ] : undefined;

		return {
			...item,
			group: isPrevious ? PREVIOUS_SLOT : 'current',
			options: {
				...item.options,
				// A comparison left unstroked takes the chart's tint of its primary's color.
				stroke:
					previousStroke ??
					item.options?.stroke ??
					( isFront ? colorOf( item, index ) : undefined ),
				type: isFront ? undefined : 'comparison',
			},
		};
	} );
}

/**
 * A date-keyed bar chart with previous-period comparison, built on
 * `@automattic/charts` `BarChart`. Styling is left to the theme, whose
 * `barStyles.widthFactor` drives the shadow's geometry — must render inside a `GlobalChartsProvider`.
 *
 * @param {ComparativeBarChartProps} props - The component props.
 * @return The rendered chart.
 */
export function ComparativeBarChart( {
	series,
	className,
	chartId: providedChartId,
	chartTitle,
	dataFormat,
	tickFormat: xTickFormatType,
	tickResolution,
	compactWhenShort = false,
	maxWidth = Infinity,
	defaultHiddenSeries,
	legendInteractive = false,
	comparisonLabel,
	tooltipExtras,
	overlayGroup,
	previousStrokes,
	onPointerDown,
	onPointerUp,
	onDatumActivate,
}: ComparativeBarChartProps ) {
	const { displayResolution } = getBucketInfo( series, tickResolution );
	const fallbackChartId = useId();
	const chartId = providedChartId ?? fallbackChartId;
	const { getElementStyles, getBarColors, isSeriesVisible, theme } = useGlobalChartsContext();

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

	// Aligning moves comparison dates onto the primary series' band slots; the
	// originals survive in `realDate` for tooltips.
	const alignedSeries = useMemo( () => alignSeriesDates( series ), [ series ] );
	const isSlotted = !! overlayGroup && alignedSeries.some( item => item.group === overlayGroup );
	const barSeries = useMemo(
		() =>
			isSlotted && overlayGroup
				? toPeriodSlots(
						alignedSeries,
						overlayGroup,
						( item, index ) => getElementStyles( { data: item, index } ).color,
						previousStrokes
					)
				: alignedSeries,
		[ alignedSeries, overlayGroup, isSlotted, getElementStyles, previousStrokes ]
	);

	const isEmptyData = useMemo( () => isEmptyChartData( alignedSeries ), [ alignedSeries ] );
	// An all-zero selected metric must not hide the extras that do have data.
	const hasTooltipRows = useMemo(
		() => ! isEmptyData || ! isEmptyChartData( tooltipExtras ?? [] ),
		[ isEmptyData, tooltipExtras ]
	);

	const barColors = useMemo( () => getBarColors( barSeries ), [ getBarColors, barSeries ] );
	const barColorOf = useCallback(
		( label: string ) => barColors[ barSeries.findIndex( drawn => drawn.label === label ) ],
		[ barColors, barSeries ]
	);

	// Each swatch follows `alignedSeries`, colored as the bar it names is drawn.
	const seriesStyles = useMemo< TooltipStyle[] >(
		() => alignedSeries.map( ( { label } ) => ( { stroke: barColorOf( label ) } ) ),
		[ alignedSeries, barColorOf ]
	);

	// Multipliers keep the tick labels short.
	const yTickFormat = useMemo(
		() => ( value: number ) =>
			formatMetricValue( value, dataFormat.type, {
				useMultipliers: true,
				currencyCode: dataFormat.options?.currencyCode,
			} ),
		[ dataFormat ]
	);

	// `undefined` hands the axis to the chart's derived formatter; `formatDate`'s
	// `medium` default would otherwise put full site-format dates on every tick.
	const xTickFormat = useMemo(
		() => ( xTickFormatType ? ( date: number ) => formatDate( date, xTickFormatType ) : undefined ),
		[ xTickFormatType ]
	);

	const primarySeriesByGroup = useMemo( () => resolvePrimarySeriesByGroup( series ), [ series ] );
	const {
		config: legendConfig,
		items: comparativeLegendItems,
		comparisonLabel: previousPeriodLabel,
	} = useComparativeLegend( alignedSeries, legendInteractive, comparisonLabel );
	// The previous slot is painted as one unit, so one static item names it after its widest shown bar:
	// the comparison setting, not the legend, shows and hides it.
	const legendItems = useMemo( () => {
		if ( ! isSlotted ) {
			return comparativeLegendItems;
		}

		const metricItems = comparativeLegendItems
			.filter( item => ! item.describesSeries )
			.map( item => ( { ...item, color: barColorOf( item.label ) ?? item.color } ) );
		const previous = barSeries.find(
			item => item.group === PREVIOUS_SLOT && isSeriesVisible( chartId, item.label )
		);

		if ( ! previous ) {
			return metricItems;
		}

		return [
			...metricItems,
			{
				label: previousPeriodLabel,
				color: barColorOf( previous.label ),
				shapeStyle: metricItems[ 0 ]?.shapeStyle,
				interactive: false,
			},
		];
	}, [
		comparativeLegendItems,
		isSlotted,
		barSeries,
		barColorOf,
		previousPeriodLabel,
		isSeriesVisible,
		chartId,
	] );

	const formatTooltipBucket = useCallback(
		( point: ComparativeDatePointDate ) => formatBucketTooltipDate( point, displayResolution ),
		[ displayResolution ]
	);

	/**
	 * Gives every comparison a tooltip row at the hovered category, a dash where its bucket is missing, and lists the rows in the series' given order.
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
				if ( augmented[ seriesData.label ] || seriesData.options?.type !== 'comparison' ) {
					continue;
				}

				// A hidden metric contributes no bar, so re-adding its shadow would put a
				// series the reader chose not to see back in the tooltip.
				const primaryLabel =
					seriesData.group !== undefined
						? primarySeriesByGroup.get( seriesData.group )?.label
						: undefined;
				if ( primaryLabel && ! datumByKey[ primaryLabel ] ) {
					continue;
				}

				// Comparison dates were aligned onto the primary axis, so the hovered
				// category matches on `date`, not on `realDate`. A bucket the comparison
				// lacks still gets an entry, so the tooltip keeps its column and reads a dash.
				const paired = seriesData.data.find( point => point.date?.getTime() === hoveredTime );

				augmented[ seriesData.label ] = {
					datum: paired ?? { date: hovered.date, value: null },
					index,
					key: seriesData.label,
				};
			}

			// The tooltip lists rows in key order, so the series keep their given order, not the order the chart draws them.
			const ordered = Object.fromEntries(
				alignedSeries
					.filter( seriesData => augmented[ seriesData.label ] )
					.map( seriesData => [ seriesData.label, augmented[ seriesData.label ] ] )
			);

			return { ...tooltipData, datumByKey: { ...ordered, ...augmented } };
		},
		[ alignedSeries, primarySeriesByGroup ]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			// `seriesStyles` follows `alignedSeries`, so the model pairs rows by index.
			const model = buildDatedTooltipModel( {
				tooltipData: withComparisonDatum( params.tooltipData ),
				series: alignedSeries,
				seriesStyles,
				extras: tooltipExtras,
				dataFormat,
				formatDate: formatTooltipBucket,
			} );

			return model && <DatedTooltip model={ model } indicatorType="rect" />;
		},
		[
			dataFormat,
			seriesStyles,
			alignedSeries,
			withComparisonDatum,
			tooltipExtras,
			formatTooltipBucket,
		]
	);

	/**
	 * A pinned domain for percentage metrics and all-zero periods. Null lets the
	 * chart scale to the data.
	 */
	const fixedYAxis = useMemo(
		() => getFixedYAxis( dataFormat.type, isEmptyData ),
		[ dataFormat.type, isEmptyData ]
	);

	const chartOptions = useMemo( () => {
		const hiddenWhenCompact = isCompact ? { display: false } : {};
		const baseOptions = {
			axis: {
				x: {
					tickFormat: xTickFormat,
					tickResolution,
					...hiddenWhenCompact,
				},
				y: {
					tickFormat: yTickFormat,
					...hiddenWhenCompact,
				},
			},
		};

		if ( ! fixedYAxis ) {
			return baseOptions;
		}

		return { ...baseOptions, yScale: { domain: fixedYAxis.domain } };
	}, [ xTickFormat, tickResolution, yTickFormat, isCompact, fixedYAxis ] );

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<BarChart
				chartId={ chartId }
				ariaLabel={ formatChartName( chartTitle ) }
				className={ styles.chartContent }
				data={ barSeries }
				options={ chartOptions }
				defaultHiddenSeries={ defaultHiddenSeries }
				legend={ legendConfig }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				margin={ isCompact ? theme.sparkline.margin : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				// A zero-value bar has no height, so a quiet day would otherwise read as
				// missing data. This draws it as a hairline stub instead.
				showZeroValues
				showLegend={ false }
				withTooltips={ hasTooltipRows }
				renderTooltip={ renderTooltip }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onDatumActivate={ onDatumActivate }
			>
				{ ! isCompact && (
					<BarChart.Legend
						items={ legendItems }
						interactive={ legendInteractive }
						shape="rect"
						className={ styles.legend }
						itemClassName={ styles.legendItem }
						itemStyles={ { margin: 0 } }
						labelClassName={ styles.legendLabel }
						labelStyles={ {
							maxWidth: '100%',
							textOverflow: 'ellipsis',
							margin: 0,
						} }
						shapeStyles={ { margin: 0 } }
					/>
				) }
			</BarChart>
		</Stack>
	);
}
