import { useContext, useMemo, forwardRef } from 'react';
import { ChartContext } from '../../providers/chart-context/chart-context';
import { BaseLegend } from './base-legend';
import type { LegendProps } from './types';

export const Legend = forwardRef< HTMLDivElement, LegendProps >(
	( { chartId, items, ...props }, ref ) => {
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

		return <BaseLegend ref={ ref } items={ legendItems } { ...props } />;
	}
);

Legend.displayName = 'Legend';
