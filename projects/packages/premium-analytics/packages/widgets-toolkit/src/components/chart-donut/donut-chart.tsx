/**
 * External dependencies
 */
import { PieChartUnresponsive as PieChart } from '@automattic/charts';
import { Icon, Stack } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import {
	resolveSegmentStyles,
	applyStylesToItems,
	isEmptyPieChartData,
	type SegmentStyle,
} from '../../helpers';
import { useElementSize } from '../../hooks';
import { ChartEmptyState } from '../chart-empty-state';
import { PieChartTooltip } from '../chart-tooltip';
import { Legend as LegendPure } from '../legend/legend';
import { MetricWithComparison } from '../metric-with-comparison';
import styles from './donut-chart.module.scss';
import type { DataFormat } from '../../types';
import type { LegendItem } from '../legend/legend';
import type { ComponentProps } from 'react';

// Default chart configuration
const DEFAULT_THICKNESS = 0.3;
const DEFAULT_CORNER_SCALE = 0.03;
const DEFAULT_GAP_SCALE = 0.01;

export type DonutChartData = ComponentProps< typeof PieChart >[ 'data' ];

const DEFAULT_SIZE = 164;
const MIN_SIZE = 64;
const MAX_SIZE = 192;
const COMPACT_LEGEND_GAP_SIZE = 8;
const DEFAULT_LEGEND_GAP_SIZE = 24;

export type DonutChartProps = {
	/**
	 * Chart segment data (label, value, percentage).
	 * Colors can be provided here or via styles prop.
	 */
	chartData: DonutChartData;

	/**
	 * Explicit styles for each segment. When provided, these take priority
	 * over colors defined in chartData[].color.
	 * Array index corresponds to segment index.
	 */
	styles?: SegmentStyle[];

	/**
	 * Primary metric value (total)
	 */
	value: number;

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
	 * Thickness of the arc (0-1).
	 * @default 0.3
	 */
	thickness?: number;

	/**
	 * Maximum chart diameter in pixels. Pass `null` to let the chart grow to
	 * the available container size.
	 * @default 192
	 */
	maxSize?: number | null;

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
 * Pure DonutChart component.
 * Does not depend on any context provider - all data flows through props.
 *
 * Colors can be provided via:
 * 1. `styles` prop (takes priority) - array of { color } per segment
 * 2. `chartData[].color` - inline color per segment
 */
export function DonutChart( {
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
	thickness = DEFAULT_THICKNESS,
	maxSize = MAX_SIZE,
	emptyStateIcon,
	emptyStateText,
	withTooltips = false,
	tooltipOffsetX,
	tooltipOffsetY,
	tooltipDataFormat,
}: DonutChartProps ) {
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
	const hasLegend = showLegend && Boolean( styledLegendData?.length );
	const availableWidth =
		typeof containerSize.width === 'number' ? containerSize.width : DEFAULT_SIZE;
	const availableHeight =
		typeof containerSize.height === 'number' ? containerSize.height : DEFAULT_SIZE;
	const legendHeight = typeof legendSize.height === 'number' ? legendSize.height : 0;
	const maxChartSize = maxSize ?? Number.POSITIVE_INFINITY;
	const targetChartSize = Math.min( maxChartSize, availableWidth );
	const isCompactLayout =
		hasLegend && availableHeight < targetChartSize + legendHeight + DEFAULT_LEGEND_GAP_SIZE;
	const legendGapSize = isCompactLayout ? COMPACT_LEGEND_GAP_SIZE : DEFAULT_LEGEND_GAP_SIZE;
	const reservedLegendHeight = hasLegend && legendHeight ? legendHeight + legendGapSize : 0;
	const chartSize = Math.max(
		MIN_SIZE,
		Math.min( maxChartSize, availableWidth, availableHeight - reservedLegendHeight )
	);
	const stackGap = isCompactLayout ? 'sm' : 'xl';

	// Render empty state when no data is available
	if ( isEmptyData ) {
		return <ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />;
	}

	return (
		<Stack
			className={ styles.reference }
			direction="column"
			align="center"
			justify="center"
			gap={ stackGap }
			ref={ containerRef }
		>
			<Stack
				className={ styles.chart }
				align="center"
				justify="center"
				style={ { width: chartSize, height: chartSize } }
			>
				<PieChart
					data={ styledChartData }
					className={ styles.pieChart }
					width={ chartSize }
					height={ chartSize }
					thickness={ thickness }
					cornerScale={ DEFAULT_CORNER_SCALE }
					gapScale={ DEFAULT_GAP_SCALE }
					padding={ 0 }
					size={ chartSize }
					showLegend={ false }
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
					showLabels={ false }
				/>
				<MetricWithComparison
					className={ styles.metricContainer }
					value={ value }
					dataFormat={ dataFormat }
					previousValue={ hasComparison ? comparisonValue : null }
					direction="column"
					align="center"
				/>
			</Stack>

			{ hasLegend && styledLegendData && (
				<Stack className={ styles.legendContainer } ref={ legendRef }>
					<LegendPure items={ styledLegendData } withComparison={ hasComparison } />
				</Stack>
			) }
		</Stack>
	);
}
