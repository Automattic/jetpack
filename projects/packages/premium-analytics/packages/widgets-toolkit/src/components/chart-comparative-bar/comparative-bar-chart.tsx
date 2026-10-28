/**
 * External dependencies
 */
import {
	BarChart,
	Stack,
	getBucketInfo,
	useBarColors,
	useGlobalChartsContext,
	type BarChartLayout,
	type TickResolution,
} from '@jetpack-premium-analytics/externals';
import {
	formatDate,
	formatMetricValue,
	type DateFormatName,
} from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
	 * the previous-period shadow behind its same-`group` primary series.
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
	 * The bar chart's layout. `overlap` draws each `group` inside the one before it, with the previous period in a slot beside the current one; the tooltip and legend swatches then take the chart's bar colors, and one legend item names the previous period.
	 */
	layout?: BarChartLayout;

	/** Label of the series the reader picked, when it is not the first one drawn. Its legend item comes first and stays locked. */
	primarySeries?: string;

	/** Start the previous period shown or hidden, and let the reader toggle it from the legend. Read when the chart mounts, like `defaultValue`, so feed back the latest value from `onPreviousPeriodShownChange`. Omit it to keep the previous period always drawn. */
	defaultPreviousPeriodShown?: boolean;

	/** Called when the reader shows or hides the previous period from the legend, not when the default is applied. */
	onPreviousPeriodShownChange?: ( shown: boolean ) => void;

	/** Pointer-down on the plot, carrying the datum nearest the pointer. */
	onPointerDown?: BarChartProps[ 'onPointerDown' ];

	/** Pointer-up on the plot, carrying the datum nearest the pointer. */
	onPointerUp?: BarChartProps[ 'onPointerUp' ];

	/** Enter or Space on the keyboard-selected bar, carrying its datum. */
	onDatumActivate?: BarChartProps[ 'onDatumActivate' ];
};

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
	layout,
	primarySeries,
	defaultPreviousPeriodShown,
	onPreviousPeriodShownChange,
	onPointerDown,
	onPointerUp,
	onDatumActivate,
}: ComparativeBarChartProps ) {
	const { displayResolution } = getBucketInfo( series, tickResolution );
	const fallbackChartId = useId();
	const chartId = providedChartId ?? fallbackChartId;
	const { isSeriesVisible, setSeriesVisibility, theme } = useGlobalChartsContext();
	const getBarColors = useBarColors();
	const overlapLayout = layout === 'overlap' ? layout : undefined;
	const previousPeriodToggle =
		overlapLayout !== undefined && defaultPreviousPeriodShown !== undefined;
	const interactiveLegend = legendInteractive || previousPeriodToggle;

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

	const isEmptyData = useMemo( () => isEmptyChartData( alignedSeries ), [ alignedSeries ] );
	// An all-zero selected metric must not hide the extras that do have data.
	const hasTooltipRows = useMemo(
		() => ! isEmptyData || ! isEmptyChartData( tooltipExtras ?? [] ),
		[ isEmptyData, tooltipExtras ]
	);

	// Each swatch takes the color its bar is drawn in.
	const seriesStyles = useMemo< TooltipStyle[] >(
		() =>
			getBarColors( alignedSeries, { layout: layout ?? 'grouped' } ).map( stroke => ( {
				stroke,
			} ) ),
		[ alignedSeries, getBarColors, layout ]
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
	} = useComparativeLegend(
		alignedSeries,
		interactiveLegend,
		comparisonLabel,
		undefined,
		layout ?? 'grouped',
		primarySeries
	);

	const comparisonIndexes = useMemo(
		() =>
			alignedSeries.flatMap( ( item, index ) =>
				item.options?.type === 'comparison' ? [ index ] : []
			),
		[ alignedSeries ]
	);
	const pickedOrFirstGroup = (
		alignedSeries.find( item => item.label === primarySeries ) ?? alignedSeries[ 0 ]
	)?.group;
	const pickedComparisonIndex =
		comparisonIndexes.find( index => alignedSeries[ index ].group === pickedOrFirstGroup ) ??
		comparisonIndexes[ 0 ];
	const pickedComparisonLabel =
		pickedComparisonIndex === undefined ? undefined : alignedSeries[ pickedComparisonIndex ].label;

	const isPrimaryVisible = useCallback(
		( group?: string ) => {
			const primaryLabel =
				group !== undefined ? primarySeriesByGroup.get( group )?.label : undefined;
			return ! primaryLabel || isSeriesVisible( chartId, primaryLabel );
		},
		[ primarySeriesByGroup, isSeriesVisible, chartId ]
	);

	const [ defaultApplied, setDefaultApplied ] = useState( false );
	let previousPeriodShown: boolean | undefined;
	if ( previousPeriodToggle && pickedComparisonLabel !== undefined ) {
		previousPeriodShown = defaultApplied
			? isSeriesVisible( chartId, pickedComparisonLabel )
			: defaultPreviousPeriodShown;
	}

	// Waits for comparison series, which can arrive after mount when the reader turns comparison on.
	useLayoutEffect( () => {
		if ( ! previousPeriodToggle || pickedComparisonLabel === undefined || defaultApplied ) {
			return;
		}
		setDefaultApplied( true );
		if ( isSeriesVisible( chartId, pickedComparisonLabel ) !== defaultPreviousPeriodShown ) {
			setSeriesVisibility( chartId, pickedComparisonLabel, defaultPreviousPeriodShown );
		}
	}, [
		previousPeriodToggle,
		pickedComparisonLabel,
		defaultApplied,
		isSeriesVisible,
		defaultPreviousPeriodShown,
		setSeriesVisibility,
		chartId,
	] );

	useLayoutEffect( () => {
		if ( previousPeriodShown === undefined ) {
			return;
		}
		for ( const index of comparisonIndexes ) {
			const { label, group } = alignedSeries[ index ];
			const drawn = previousPeriodShown && isPrimaryVisible( group );
			if ( index !== pickedComparisonIndex && isSeriesVisible( chartId, label ) !== drawn ) {
				setSeriesVisibility( chartId, label, drawn );
			}
		}
	}, [
		previousPeriodShown,
		comparisonIndexes,
		alignedSeries,
		pickedComparisonIndex,
		isPrimaryVisible,
		isSeriesVisible,
		setSeriesVisibility,
		chartId,
	] );

	const reportedPreviousPeriodShown = useRef( previousPeriodShown );
	useEffect( () => {
		const reported = reportedPreviousPeriodShown.current;
		reportedPreviousPeriodShown.current = previousPeriodShown;
		if (
			reported !== undefined &&
			previousPeriodShown !== undefined &&
			reported !== previousPeriodShown
		) {
			onPreviousPeriodShownChange?.( previousPeriodShown );
		}
	}, [ previousPeriodShown, onPreviousPeriodShownChange ] );

	// Overlap paints the previous period as one slot, so one item names it, in the color of the picked metric's previous bar, or else of its widest shown bar.
	const legendItems = useMemo( () => {
		if ( ! overlapLayout ) {
			return comparativeLegendItems;
		}

		const metricItems = comparativeLegendItems.filter( item => ! item.describesSeries );

		if ( previousPeriodToggle ) {
			const ownSeriesItems = metricItems.map( item => ( {
				...item,
				seriesLabels: [ item.label ],
			} ) );
			if ( pickedComparisonIndex === undefined ) {
				return ownSeriesItems;
			}
			const followingComparisons = comparisonIndexes.flatMap( index =>
				index !== pickedComparisonIndex && isPrimaryVisible( alignedSeries[ index ].group )
					? [ alignedSeries[ index ].label ]
					: []
			);
			return [
				...ownSeriesItems,
				{
					label: previousPeriodLabel,
					color: seriesStyles[ pickedComparisonIndex ].stroke,
					shapeStyle: metricItems[ 0 ]?.shapeStyle,
					interactive: true,
					seriesLabels: [ alignedSeries[ pickedComparisonIndex ].label, ...followingComparisons ],
				},
			];
		}

		const pickedGroup = alignedSeries.find( item => item.label === primarySeries )?.group;
		const shownPrevious = alignedSeries.flatMap( ( item, index ) =>
			item.options?.type === 'comparison' && isSeriesVisible( chartId, item.label ) ? [ index ] : []
		);
		const legendPrevious =
			shownPrevious.find( index => alignedSeries[ index ].group === pickedGroup ) ??
			shownPrevious[ 0 ];

		if ( legendPrevious === undefined ) {
			return metricItems;
		}

		return [
			...metricItems,
			{
				label: previousPeriodLabel,
				color: seriesStyles[ legendPrevious ].stroke,
				shapeStyle: metricItems[ 0 ]?.shapeStyle,
				interactive: false,
			},
		];
	}, [
		overlapLayout,
		comparativeLegendItems,
		previousPeriodToggle,
		pickedComparisonIndex,
		comparisonIndexes,
		isPrimaryVisible,
		alignedSeries,
		primarySeries,
		isSeriesVisible,
		chartId,
		previousPeriodLabel,
		seriesStyles,
	] );

	const formatTooltipBucket = useCallback(
		( point: ComparativeDatePointDate ) => formatBucketTooltipDate( point, displayResolution ),
		[ displayResolution ]
	);

	/**
	 * Re-attaches the hovered category's previous-period value to the tooltip
	 * data: the bar chart's default tooltip only carries the primary series, so
	 * without this the shadow bar would be visible but its value unreadable.
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
				if (
					seriesData.options?.type !== 'comparison' ||
					augmented[ seriesData.label ] ||
					! isSeriesVisible( chartId, seriesData.label )
				) {
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

			return { ...tooltipData, datumByKey: augmented };
		},
		[ alignedSeries, primarySeriesByGroup, isSeriesVisible, chartId ]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			// `seriesStyles` follows `alignedSeries`, so the model pairs rows by that order.
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
				data={ alignedSeries }
				layout={ layout }
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
						interactive={ interactiveLegend }
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
