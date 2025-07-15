import { useContext, useMemo } from 'react';
import { ChartContext } from '../../providers/chart-context/chart-context';
import { BaseLegend } from './base-legend';
import type { LegendProps } from './types';
import type { FC } from 'react';

export const Legend: FC< LegendProps > = ( { chartId, items, ...props } ) => {
	// Get context but don't throw if it doesn't exist
	const context = useContext( ChartContext );

	// Use useMemo to ensure re-rendering when context changes
	const contextItems = useMemo( () => {
		return chartId && context ? context.getChartData( chartId )?.legendItems : undefined;
	}, [ chartId, context ] );

	// Use context items if available, otherwise fall back to provided items
	const legendItems = ( contextItems || items ) as typeof items;

	if ( ! legendItems ) {
		return null;
	}

	return <BaseLegend items={ legendItems } { ...props } />;
};
