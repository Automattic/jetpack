import { useContext, useMemo, forwardRef } from 'react';
import { ChartInstanceContext } from '../../charts/private/chart-instance-context';
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
		const chartInstanceContext = useContext( ChartInstanceContext );

		// When chartId is used, it is standalone mode
		// When chartId is not provided, we use the context's chartId, meaning it is inside a chart instance
		const contextChartId = chartId ?? chartInstanceContext?.chartId;

		const chartData = useMemo(
			() => ( contextChartId && context ? context.getChartData( contextChartId ) : undefined ),
			[ contextChartId, context ]
		);

		const contextItems = chartData?.legendItems;

		// The chart around this legend, when the legend is its own. It has the items already,
		// where the registry fills from an effect a frame later, too late for a chart whose
		// plot is sized from the room this legend leaves it.
		const instance =
			chartInstanceContext?.chartId === contextChartId ? chartInstanceContext : undefined;

		// Derive the default legend shape from the chart type when no explicit shape is provided
		const chartType = instance?.chartType ?? chartData?.chartType;
		const resolvedShape = shape ?? ( chartType ? defaultShapeByChartType[ chartType ] : undefined );

		// Provided items take precedence over the chart's, then the registry's
		const legendItems = ( items || instance?.legendItems || contextItems ) as typeof items;

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
