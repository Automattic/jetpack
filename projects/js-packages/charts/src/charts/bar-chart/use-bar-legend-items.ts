import { useMemo } from 'react';
import { useChartLegendItems } from '../../components/legend/hooks/use-chart-legend-items';
import { useBarColors } from './use-bar-colors';
import type { ChartLegendOptions } from '../../components/legend/hooks/use-chart-legend-items';
import type { BaseLegendItem } from '../../components/legend/types';
import type { BarChartLayout, LegendShape, SeriesData } from '../../types';

export type BarLegendOptions = Omit< ChartLegendOptions, 'seriesColors' > & {
	/** The layout the bars are drawn in. Unset, the items are the chart legend's own. */
	layout?: BarChartLayout;
};

const isComparison = ( data: SeriesData[], label: string | undefined ) =>
	data.some( series => series.label === label && series.options?.type === 'comparison' );

/**
 * Applies what a bar layout changes about a legend: overlap lists every primary before every comparison, as it draws their slots, with every swatch opaque like its bar; a collapsed grouped item takes its comparison's tint, the wider bar that frames the group.
 *
 * @param data         - The series the items were built from.
 * @param items        - The legend items.
 * @param layout       - The layout the bars are drawn in.
 * @param seriesColors - Each series' bar color, by index.
 * @return The legend items.
 */
function forBarLayout(
	data: SeriesData[],
	items: BaseLegendItem[],
	layout: BarChartLayout,
	seriesColors: string[]
): BaseLegendItem[] {
	if ( layout === 'overlap' ) {
		const opaque = items.map( item =>
			item.shapeStyle ? { ...item, shapeStyle: { ...item.shapeStyle, opacity: undefined } } : item
		);
		// Static items, such as a comparison item, follow the series items and keep their place.
		const seriesItems = opaque.filter( item => item.seriesLabels );
		const firstLabel = ( item: BaseLegendItem ) => item.seriesLabels?.[ 0 ];

		return [
			...seriesItems.filter( item => ! isComparison( data, firstLabel( item ) ) ),
			...seriesItems.filter( item => isComparison( data, firstLabel( item ) ) ),
			...opaque.filter( item => ! item.seriesLabels ),
		];
	}

	return items.map( item => {
		if ( ( item.seriesLabels?.length ?? 0 ) < 2 ) {
			return item;
		}
		const comparisonIndex = data.findIndex(
			series => series.options?.type === 'comparison' && item.seriesLabels?.includes( series.label )
		);

		return comparisonIndex === -1 ? item : { ...item, color: seriesColors[ comparisonIndex ] };
	} );
}

/**
 * Builds legend items that match `BarChart`'s bars in a layout, for a custom legend or a chart's own.
 *
 * @param data        - The series the chart draws.
 * @param options     - The legend options, and the layout the bars are drawn in.
 * @param legendShape - The shape of the legend swatches.
 * @return The legend items.
 */
export function useBarLegendItems(
	data: SeriesData[],
	options: BarLegendOptions = {},
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const { layout } = options;
	const getBarColors = useBarColors();
	const seriesColors = useMemo(
		() => ( layout ? getBarColors( data, { layout } ) : undefined ),
		[ data, layout, getBarColors ]
	);
	const chartLegendOptions = useMemo(
		(): ChartLegendOptions => ( { ...options, seriesColors } ),
		[ options, seriesColors ]
	);
	const items = useChartLegendItems( data, chartLegendOptions, legendShape );

	return useMemo(
		() => ( layout && seriesColors ? forBarLayout( data, items, layout, seriesColors ) : items ),
		[ data, items, layout, seriesColors ]
	);
}
