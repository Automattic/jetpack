/**
 * External dependencies
 */
import { PieSemiCircleChart } from '@automattic/charts';
import { Icon, Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import {
	resolveSegmentStyles,
	applyStylesToItems,
	isEmptyPieChartData,
	type SegmentStyle,
} from '../../helpers';
import { useElementSize } from '../../hooks';
import { ChartEmptyState } from '../chart-empty-state';
import { PieChartTooltip } from '../chart-tooltip';
/**
 * Internal dependencies
 */
import { Legend as LegendPure } from '../legend/legend';
import { MetricWithComparison } from '../metric-with-comparison';
import styles from './semi-circle-chart.module.scss';
import type { DataFormat } from '../../types';
import type { LegendItem } from '../legend/legend';
import type { ComponentProps } from 'react';

// Default chart configuration
const DEFAULT_THICKNESS = 0.3;
const DEFAULT_ASPECT_RATIO = 0.5;

// Smallest chart width we allow before letting the tile scroll instead of
// shrinking the semi-circle into illegibility.
const MIN_CHART_WIDTH = 120;
// Fallback container dimension used before the ResizeObserver reports a size.
const DEFAULT_CONTAINER_SIZE = 240;
// Vertical gap between the chart and the legend, matching the `xl`/`sm` gap
// tokens applied to the wrapper Stack (24px / 8px).
const DEFAULT_LEGEND_GAP_SIZE = 24;
const COMPACT_LEGEND_GAP_SIZE = 8;

export type SemiCircleChartData = ComponentProps< typeof PieSemiCircleChart >[ 'data' ];

export type SemiCircleChartProps = {
	/**
	 * Chart segment data (label, value).
	 * Colors can be provided here or via styles prop.
	 */
	chartData: SemiCircleChartData;

	/**
	 * Explicit styles for each segment. When provided, these take priority
	 * over colors defined in chartData[].color.
	 * Array index corresponds to segment index.
	 */
	styles?: SegmentStyle[];

	/**
	 * Primary metric value (total)
	 */
	value?: number;

	/**
	 * Optional comparison value (previous period)
	 */
	comparisonValue?: number | null;

	/**
	 * Format for displaying values
	 */
	dataFormat?: DataFormat;

	/**
	 * Legend items. Colors will be applied from styles prop if provided.
	 */
	legendData?: LegendItem[];

	/**
	 * Show legend below chart
	 */
	showLegend?: boolean;

	/**
	 * Show the center metric value.
	 * @default true
	 */
	showMetric?: boolean;

	/**
	 * Thickness of the arc (0-1).
	 * @default 0.3
	 */
	thickness?: number;

	/**
	 * Aspect ratio of the chart (height / width). Keeps the semi-circle's
	 * intended proportions when the widget cell size changes.
	 * @default 0.5
	 */
	aspectRatio?: number;

	/**
	 * Hard upper bound for the chart width, in pixels. The chart otherwise grows
	 * to fill its container while staying bounded by the tile height (so it never
	 * overflows a short cell). Leave unset to only be bounded by the tile.
	 * @default Infinity
	 */
	maxWidth?: number;

	/**
	 * Icon to display in the empty state
	 */
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];

	/**
	 * Text to display in the empty state
	 */
	emptyStateText?: string;

	/**
	 * Enable tooltips on pie chart hover.
	 * @default false
	 */
	withTooltips?: boolean;

	/**
	 * Horizontal offset for tooltip positioning.
	 */
	tooltipOffsetX?: number;

	/**
	 * Vertical offset for tooltip positioning.
	 */
	tooltipOffsetY?: number;

	/**
	 * Format for tooltip segment values. Use when the segment values have a
	 * different format than the center metric's `dataFormat` (e.g. center shows
	 * percentage but segments are currency). Falls back to `dataFormat`.
	 */
	tooltipDataFormat?: DataFormat;
};

/**
 * Pure SemiCircleChart component.
 * Does not depend on any context provider - all data flows through props.
 *
 * Colors can be provided via:
 * 1. `styles` prop (takes priority) - array of { color } per segment
 * 2. `chartData[].color` - inline color per segment
 */
export function SemiCircleChart( {
	chartData,
	styles: stylesProp,
	value,
	comparisonValue,
	dataFormat = {
		type: 'number',
		options: { useMultipliers: true, decimals: 0 },
	},
	legendData,
	showLegend = true,
	showMetric = true,
	thickness = DEFAULT_THICKNESS,
	aspectRatio = DEFAULT_ASPECT_RATIO,
	maxWidth = Infinity,
	emptyStateIcon,
	emptyStateText,
	withTooltips = false,
	tooltipOffsetX,
	tooltipOffsetY,
	tooltipDataFormat,
}: SemiCircleChartProps ) {
	const hasComparison = comparisonValue !== null && comparisonValue !== undefined;

	const [ containerRef, containerSize ] = useElementSize< HTMLDivElement >();
	const [ legendRef, legendSize ] = useElementSize< HTMLDivElement >();

	/**
	 * Resolve styles: prop takes priority, fallback to chartData colors.
	 */
	const resolvedStyles = useMemo(
		() => resolveSegmentStyles( stylesProp, chartData ),
		[ stylesProp, chartData ]
	);

	/**
	 * Apply styles to chart data
	 */
	const styledChartData = useMemo( () => {
		if ( ! stylesProp?.length ) {
			return chartData;
		}
		return applyStylesToItems( chartData, resolvedStyles );
	}, [ stylesProp, chartData, resolvedStyles ] );

	/**
	 * Apply styles to legend data
	 */
	const styledLegendData = useMemo( () => {
		if ( ! legendData ) {
			return undefined;
		}
		return applyStylesToItems( legendData, resolvedStyles );
	}, [ legendData, resolvedStyles ] );

	const isEmptyData = isEmptyPieChartData( chartData );

	// Render empty state when no data is available
	if ( isEmptyData ) {
		return <ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />;
	}

	const hasLegend = showLegend && Boolean( styledLegendData?.length );
	const hardMaxWidth = Number.isFinite( maxWidth ) ? maxWidth : Number.POSITIVE_INFINITY;
	const availableWidth = containerSize.width || DEFAULT_CONTAINER_SIZE;
	const availableHeight = containerSize.height || DEFAULT_CONTAINER_SIZE;
	const legendHeight = legendSize.height;

	// Natural chart height when only the width constrains it; used to decide
	// whether the tile is too short to afford the default chart-to-legend gap.
	const widthBoundedHeight = Math.min( availableWidth, hardMaxWidth ) * aspectRatio;
	const isCompactLayout =
		hasLegend && availableHeight < widthBoundedHeight + legendHeight + DEFAULT_LEGEND_GAP_SIZE;
	const legendGapSize = isCompactLayout ? COMPACT_LEGEND_GAP_SIZE : DEFAULT_LEGEND_GAP_SIZE;
	const reservedLegendHeight = hasLegend && legendHeight ? legendHeight + legendGapSize : 0;

	// Cap the width so the derived height (width * aspectRatio) fits the space
	// left after the legend, keeping the whole widget contained in a short tile
	// while still growing to fill taller/wider cells.
	const availableChartHeight = availableHeight - reservedLegendHeight;
	const heightBoundedWidth =
		availableChartHeight > 0 ? availableChartHeight / aspectRatio : MIN_CHART_WIDTH;
	const chartMaxWidth = Math.max( MIN_CHART_WIDTH, Math.min( hardMaxWidth, heightBoundedWidth ) );
	const stackGap = isCompactLayout ? 'sm' : 'xl';

	return (
		<Stack
			direction="column"
			align="center"
			justify="safe center"
			className={ styles.container }
			ref={ containerRef }
		>
			<Stack
				direction="column"
				align="center"
				className={ styles.wrapper }
				style={ { maxWidth: chartMaxWidth } }
				gap={ stackGap }
			>
				<PieSemiCircleChart
					data={ styledChartData }
					className={ styles.chart }
					thickness={ thickness }
					clockwise={ false }
					aspectRatio={ aspectRatio }
					withTooltips={ withTooltips }
					{ ...( tooltipOffsetX !== undefined && {
						tooltipOffsetX,
					} ) }
					{ ...( tooltipOffsetY !== undefined && {
						tooltipOffsetY,
					} ) }
					renderTooltip={ ( { tooltipData } ) => (
						<PieChartTooltip
							tooltipData={ tooltipData }
							dataFormat={ tooltipDataFormat ?? dataFormat }
						/>
					) }
					resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				>
					{ showMetric && value !== undefined && (
						<MetricWithComparison
							className={ styles.metricContainer }
							value={ value }
							dataFormat={ dataFormat }
							previousValue={ hasComparison ? comparisonValue : null }
							direction="column"
							align="center"
						/>
					) }
				</PieSemiCircleChart>

				{ hasLegend && styledLegendData && (
					<div ref={ legendRef } className={ styles.legendContainer }>
						<LegendPure items={ styledLegendData } withComparison={ hasComparison } />
					</div>
				) }
			</Stack>
		</Stack>
	);
}
