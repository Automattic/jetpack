import { useContext, useMemo, forwardRef } from 'react';
import { GlobalChartsContext } from '../../providers';
import { SingleChartContext } from '../private/single-chart-context';
import { BaseLegend } from './private';
import type { LegendProps } from './types';

export const Legend = forwardRef< HTMLDivElement, LegendProps >(
	( { chartId, items, ...props }, ref ) => {
		// Get context but don't throw if it doesn't exist
		const context = useContext( GlobalChartsContext );
		const singleChartContext = useContext( SingleChartContext );

		// When chartId is used, it is standalone mode
		// When chartId is not provided, we use the context's chartId, meaning it is in a single chart context
		const contextChartId = chartId ?? singleChartContext?.chartId;

		// Use useMemo to ensure re-rendering when context changes
		const contextItems = useMemo( () => {
			return contextChartId && context
				? context.getChartData( contextChartId )?.legendItems
				: undefined;
		}, [ contextChartId, context ] );

		// Provided items take precedence over context items
		const legendItems = ( items || contextItems ) as typeof items;

		if ( ! legendItems ) {
			return null;
		}

		return <BaseLegend ref={ ref } items={ legendItems } { ...props } />;
	}
);
