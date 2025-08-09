import { useContext, useMemo, forwardRef } from 'react';
import { GlobalChartsContext } from '../../providers/chart-context/global-charts-provider';
import { SingleChartContext } from '../shared/single-chart-context';
import { BaseLegend } from './base-legend';
import type { LegendProps } from './types';

export const Legend = forwardRef< HTMLDivElement, LegendProps >(
	( { chartId, items, ...props }, ref ) => {
		// Get context but don't throw if it doesn't exist
		const context = useContext( GlobalChartsContext );
		const singleChartContext = useContext( SingleChartContext );
		const contextChartId = chartId ?? singleChartContext.chartId;

		// Use useMemo to ensure re-rendering when context changes
		const contextItems = useMemo( () => {
			return contextChartId && context
				? context.getChartData( contextChartId )?.legendItems
				: undefined;
		}, [ contextChartId, context ] );

		// Use context items if available, otherwise fall back to provided items
		const legendItems = ( contextItems || items ) as typeof items;

		if ( ! legendItems ) {
			return null;
		}

		return <BaseLegend ref={ ref } items={ legendItems } { ...props } />;
	}
);
