import { useMemo } from 'react';
import type { LegendPosition } from '../types';

interface UseLegendLayoutParams {
	/**
	 * Total height of the chart container
	 */
	height: number;

	/**
	 * Whether the legend is shown
	 */
	showLegend: boolean;

	/**
	 * Position of the legend
	 */
	legendPosition: LegendPosition;

	/**
	 * Measured height of the legend element
	 */
	legendHeight: number;

	/**
	 * Default margin for the chart
	 */
	defaultMargin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
}

interface UseLegendLayoutReturn {
	/**
	 * Adjusted height for the chart area (excluding legend)
	 */
	adjustedChartHeight: number;

	/**
	 * Adjusted margin object for the chart
	 */
	adjustedMargin: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};

	/**
	 * CSS class name for the chart container based on legend position
	 */
	containerClassName: string;
}

/**
 * Hook to calculate layout adjustments for charts with legends.
 * Abstracts the logic for adjusting chart height and margins based on legend position.
 *
 * @param {UseLegendLayoutParams} params                      - Layout parameters
 * @param {number}                params.height               - Total height of the chart container
 * @param {boolean}               params.showLegend           - Whether the legend is shown
 * @param {LegendPosition}        params.legendPosition       - Position of the legend
 * @param {number}                params.legendHeight         - Measured height of the legend element
 * @param {object}                params.defaultMargin        - Default margin for the chart
 * @param {number}                params.defaultMargin.top    - Top margin
 * @param {number}                params.defaultMargin.right  - Right margin
 * @param {number}                params.defaultMargin.bottom - Bottom margin
 * @param {number}                params.defaultMargin.left   - Left margin
 * @return {UseLegendLayoutReturn} Layout adjustments for the chart
 */
export const useLegendLayout = ( {
	height,
	showLegend,
	legendPosition,
	legendHeight,
	defaultMargin = {},
}: UseLegendLayoutParams ): UseLegendLayoutReturn => {
	return useMemo( () => {
		// Calculate adjusted chart height
		const adjustedChartHeight =
			showLegend && legendPosition === 'top' ? height - legendHeight : height;

		// Calculate adjusted margin for top legend position
		const adjustedMargin =
			showLegend && legendPosition === 'top'
				? {
						...defaultMargin,
						top: ( defaultMargin.top || 0 ) + legendHeight,
				  }
				: defaultMargin;

		// Determine container class name
		const containerClassName =
			showLegend && legendPosition === 'top'
				? 'chart-container--legend-top'
				: 'chart-container--legend-bottom';

		return {
			adjustedChartHeight,
			adjustedMargin,
			containerClassName,
		};
	}, [ height, showLegend, legendPosition, legendHeight, defaultMargin ] );
};
