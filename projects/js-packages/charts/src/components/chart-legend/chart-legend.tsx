import { useChartContext } from '../../providers/chart-context';
import { BaseLegend } from '../legend/base-legend';
import type { ChartLegendProps } from './types';
import type { FC } from 'react';

export const ChartLegend: FC< ChartLegendProps > = ( { chartId, items, ...props } ) => {
	const { getChartData } = useChartContext();

	// If chartId is provided, get items from chart context
	const contextItems = chartId ? getChartData( chartId )?.legendItems : undefined;

	// Use context items if available, otherwise fall back to provided items
	const legendItems = ( contextItems || items ) as typeof items;

	if ( ! legendItems ) {
		return null;
	}

	return <BaseLegend items={ legendItems } { ...props } />;
};
