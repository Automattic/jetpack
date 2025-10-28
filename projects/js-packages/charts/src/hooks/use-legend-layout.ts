import { useMemo } from 'react';
import type { LegendPosition } from '../types';

interface UseLegendLayoutParams {
	height: number;
	showLegend: boolean;
	legendPosition: LegendPosition;
	legendHeight: number;
	defaultMargin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
}

interface UseLegendLayoutReturn {
	adjustedChartHeight: number;
	adjustedMargin: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
	containerClassName: string;
}

/**
 * Calculates layout adjustments for charts with legends.
 * Handles chart height reduction and margin adjustments when legend is positioned at top.
 *
 * @param {UseLegendLayoutParams} params - Layout parameters including height, legend position, and margins
 * @return {UseLegendLayoutReturn} Adjusted height, margins, and CSS class name for container
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
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Using individual margin properties to avoid object reference changes
	}, [
		height,
		showLegend,
		legendPosition,
		legendHeight,
		defaultMargin.top,
		defaultMargin.right,
		defaultMargin.bottom,
		defaultMargin.left,
	] );
};
