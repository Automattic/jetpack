export { Legend } from './legend';
export { BaseLegend } from './base-legend';
export { useChartLegendData } from './use-chart-legend-data';
export type { LegendProps, BaseLegendProps } from './types';
export type { ChartLegendOptions } from './use-chart-legend-data';

// Shared legend defaults for all chart types
export const SHARED_LEGEND_DEFAULTS = {
	showLegend: false,
	legendOrientation: 'horizontal' as const,
	legendAlignmentHorizontal: 'center' as const,
	legendAlignmentVertical: 'bottom' as const,
} as const;
