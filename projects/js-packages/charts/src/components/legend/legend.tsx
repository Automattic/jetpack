import { useContext, useMemo, forwardRef } from 'react';
import { SingleChartContext } from '../../charts/private/single-chart-context';
import { GlobalChartsContext } from '../../providers';
import { BaseLegend } from './private';
import type { LegendProps } from './types';
import type { ChartType, LegendShape } from '../../types';

const defaultShapeByChartType: Partial<
	Record< ChartType, Extract< LegendShape< unknown, unknown >, string > >
> = {
	area: 'rect',
	line: 'line',
	bar: 'rect',
	pie: 'circle',
	'pie-semi-circle': 'circle',
	leaderboard: 'circle',
};

export const Legend = forwardRef< HTMLDivElement, LegendProps >(
	( { chartId, items, shape, ...props }, ref ) => {
		// Get context but don't throw if it doesn't exist
		const context = useContext( GlobalChartsContext );
		const singleChartContext = useContext( SingleChartContext );

		// When chartId is used, it is standalone mode
		// When chartId is not provided, we use the context's chartId, meaning it is in a single chart context
		const contextChartId = chartId ?? singleChartContext?.chartId;

		const chartData = useMemo(
			() => ( contextChartId && context ? context.getChartData( contextChartId ) : undefined ),
			[ contextChartId, context ]
		);

		const contextItems = chartData?.legendItems;

		// Derive the default legend shape from the chart type when no explicit shape is provided
		const resolvedShape =
			shape ??
			( chartData?.chartType ? defaultShapeByChartType[ chartData.chartType ] : undefined );

		// Provided items take precedence over context items
		const legendItems = ( items || contextItems ) as typeof items;

		if ( ! legendItems ) {
			return null;
		}

		return (
			<BaseLegend
				ref={ ref }
				items={ legendItems }
				shape={ resolvedShape }
				{ ...props }
				chartId={ contextChartId }
			/>
		);
	}
);
