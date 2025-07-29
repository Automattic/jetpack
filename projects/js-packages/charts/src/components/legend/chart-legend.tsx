import { useChartIdFromContext } from '../../providers/chart-context';
import { Legend } from './legend';
import type { LegendProps } from './types';
import type { FC } from 'react';

export type ChartLegendProps = Omit< LegendProps, 'items' | 'chartId' > & {
	items?: LegendProps[ 'items' ];
	chartId?: string;
};

/**
 * Legend component for use in chart composition API.
 *
 * Automatically connects to the parent chart's context to retrieve
 * legend data when used as a child component (e.g., <Chart.Legend />).
 * Falls back to standalone mode with explicit props when needed.
 *
 * Key features:
 * - Automatically inherits chartId from parent chart context
 * - Falls back to explicit chartId prop if provided
 * - Works seamlessly in both composition and standalone modes
 *
 * @param props - Legend component props (items and chartId are optional)
 * @return The rendered legend component
 */
export const ChartLegend: FC< ChartLegendProps > = props => {
	// Try to get chartId from context if not provided
	const contextChartId = useChartIdFromContext();

	// Use provided chartId, fall back to context chartId
	const effectiveChartId = props.chartId || contextChartId;

	return <Legend { ...props } chartId={ effectiveChartId } />;
};

ChartLegend.displayName = 'ChartLegend';
