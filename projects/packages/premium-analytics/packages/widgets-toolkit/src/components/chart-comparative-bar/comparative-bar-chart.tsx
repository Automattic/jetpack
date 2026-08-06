/**
 * External dependencies
 */
import { BarChart, Stack, useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
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
import { isEmptyChartData, getEmptyChartDomain } from '../../helpers';
import { alignSeriesDates } from '../chart-comparative-line/utils';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-bar-chart.module.scss';
import type { BarSeriesStyle, ComparativeBarChartSeries } from './types';
import type { DataFormat } from '../../types';
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
 * two on one flag without reshaping its data or re-deriving styles.
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
	 * Degrade to a sparkline (no y-axis, grid, or legend) when the chart area
	 * is too short for readable axis labels. Defaults to false.
	 */
	compactWhenShort?: boolean;

	/**
	 * Maximum chart width. Passed through to the underlying chart.
	 */
	maxWidth?: number;
};

/**
 * A date-keyed bar chart with previous-period comparison, built on
 * `@automattic/charts` `BarChart`.
 *
 * Bar styling is left to the charts theme rather than passed in: the comparison
 * shadow's geometry is driven by the theme's `barStyles.widthFactor`, so
 * overriding fills here would decouple the shadow from the bar it shadows.
 * Colours are read back through `getElementStyles` only to tint the tooltip
 * swatches, matching what the chart drew.
 *
 * @param {ComparativeBarChartProps} props - The component props.
 * @return The rendered chart.
 */
export function ComparativeBarChart( {
	series,
	className,
	dataFormat,
	tickFormat: xTickFormatType,
	compactWhenShort = false,
	maxWidth = Infinity,
}: ComparativeBarChartProps ) {
	const chartId = useId();
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
	 * Tooltip swatch colours, resolved from the chart theme so they match the
	 * bars the chart actually drew.
	 */
	const seriesStyles = useMemo< BarSeriesStyle[] >(
		() =>
			alignedSeries.map( ( seriesData, index ) => ( {
				stroke: getElementStyles( { data: seriesData, index } ).color,
			} ) ),
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

	const xTickFormat = useCallback(
		( date: number ) => formatDate( date, xTickFormatType ),
		[ xTickFormatType ]
	);

	/**
	 * Label a tooltip row by its point's own date. Comparison points carry the
	 * primary series' date for axis alignment, so read `realDate` when present
	 * or the row would repeat the current period's date.
	 */
	const getTooltipLabel = useCallback(
		( datum: { date?: Date; realDate?: Date }, _index: number, key: string ): string => {
			const displayDate = datum.realDate ?? datum.date;
			if ( ! displayDate ) {
				return key;
			}
			return formatDate( displayDate );
		},
		[]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => (
			<ChartTooltip
				tooltipData={ params.tooltipData }
				dataFormat={ dataFormat }
				seriesStyles={ seriesStyles }
				indicatorType="rect"
				getLabel={ getTooltipLabel }
			/>
		),
		[ dataFormat, seriesStyles, getTooltipLabel ]
	);

	const chartOptions = useMemo( () => {
		const baseOptions = {
			axis: {
				x: {
					// Must stay conditional: `formatDate` defaults to `medium`, so an
					// unconditional `xTickFormat` would put full site-format dates on every
					// tick. Without the prop, the chart library's own tick labels stay in use.
					tickFormat: xTickFormatType ? xTickFormat : undefined,
				},
				y: {
					tickFormat: yTickFormat,
					// Hide the y-axis on short tiles; its labels would otherwise overlap.
					...( isCompact ? { display: false } : {} ),
				},
			},
		};

		if ( ! isEmptyData ) {
			return baseOptions;
		}

		// Give an all-zero chart a meaningful axis instead of a flat baseline.
		return {
			...baseOptions,
			yScale: { domain: getEmptyChartDomain( dataFormat.type ) },
		};
	}, [ xTickFormat, xTickFormatType, yTickFormat, isCompact, isEmptyData, dataFormat.type ] );

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<BarChart
				chartId={ chartId }
				className={ styles.chartContent }
				data={ alignedSeries }
				options={ chartOptions }
				// With the y-axis hidden, reclaim its reserved left margin for the bars.
				margin={ isCompact ? { ...DEFAULT_MARGIN, left: 0 } : DEFAULT_MARGIN }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				showLegend={ false }
				withTooltips={ ! isEmptyData }
				renderTooltip={ renderTooltip }
			>
				{ /* The solid bar and its translucent shadow already convey current vs previous. */ }
				{ ! isCompact && (
					<BarChart.Legend
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
