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
	 * Width of the chart.
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

	return (
		<Stack direction="column" align="center" justify="center" className={ styles.container }>
			<Stack
				direction="column"
				className={ styles.wrapper }
				style={ Number.isFinite( maxWidth ) ? { maxWidth } : undefined }
				gap="xl"
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

				{ showLegend && styledLegendData && (
					<LegendPure items={ styledLegendData } withComparison={ hasComparison } />
				) }
			</Stack>
		</Stack>
	);
}
