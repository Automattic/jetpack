import { Legend } from './legend';
import type { LegendProps } from './types';
import type { FC } from 'react';

export type ChartLegendProps = LegendProps;

/**
 * Legend component for use in chart composition API.
 *
 * Uses the same proven API as the standalone Legend component.
 * No prop conversion or mapping - just a clean interface for
 * composition patterns like <Chart.Legend />.
 *
 * @param props - All Legend component props
 * @return The rendered legend component
 */
export const ChartLegend: FC< ChartLegendProps > = props => {
	return <Legend { ...props } />;
};
