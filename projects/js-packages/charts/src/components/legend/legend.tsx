import { useContext } from 'react';
import { ChartContext } from '../../providers/chart-context/chart-context';
import { BaseLegend } from './base-legend';
import type { LegendProps } from './types';
import type { FC } from 'react';

export const Legend: FC< LegendProps > = ( { chartId, items, ...props } ) => {
	// Get context but don't throw if it doesn't exist
	const context = useContext( ChartContext );

	// If chartId is provided and context exists, get items from chart context
	const contextItems =
		chartId && context ? context.getChartData( chartId )?.legendItems : undefined;

	// Use context items if available, otherwise fall back to provided items
	const legendItems = ( contextItems || items ) as typeof items;

	if ( ! legendItems ) {
		return null;
	}

	return <BaseLegend items={ legendItems } { ...props } />;
};
