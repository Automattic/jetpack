import { useMemo } from 'react';
import {
	useChartLegendItems,
	getComparisonItemLabel,
} from '../../components/legend/hooks/use-chart-legend-items';
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
 * The series a stacked layout's legend lists: every primary, then, with a comparison item, the comparison total it draws.
 *
 * @param data           - The chart's series.
 * @param comparisonItem - The legend's `comparisonItem` option.
 * @return The series, each one's index in `data`, and the comparison the total's item is shown with.
 */
function getStackedLegendSeries(
	data: SeriesData[],
	comparisonItem: BarLegendOptions[ 'comparisonItem' ]
): { series: SeriesData[]; indexes: number[]; describes?: string } {
	const indexes = data.flatMap( ( series, index ) =>
		series.options?.type === 'comparison' ? [] : [ index ]
	);
	const comparison = data.findIndex( series => series.options?.type === 'comparison' );
	const series = indexes.map( index => data[ index ] );

	if ( ! comparisonItem || comparison === -1 ) {
		return { series, indexes };
	}

	return {
		series: [
			...series,
			{
				label: getComparisonItemLabel( comparisonItem ),
				data: [],
				options: { type: 'comparison' },
			},
		],
		indexes: [ ...indexes, comparison ],
		describes: data[ comparison ].label,
	};
}

/**
 * Applies what a bar layout changes about a legend: a stacked comparison total is a static item; overlap lists every primary before every comparison, as it draws their slots, with every swatch opaque like its bar; a collapsed grouped item takes its comparison's tint, the wider bar that frames the group.
 *
 * @param data         - The series the items were built from.
 * @param items        - The legend items.
 * @param layout       - The layout the bars are drawn in.
 * @param seriesColors - Each series' bar color, by index.
 * @param describes    - The comparison a stacked total's item leaves the legend with while it is hidden.
 * @return The legend items.
 */
function forBarLayout(
	data: SeriesData[],
	items: BaseLegendItem[],
	layout: BarChartLayout,
	seriesColors: string[],
	describes?: string
): BaseLegendItem[] {
	if ( layout === 'stacked' ) {
		// The comparison total is not a series to toggle: hiding a primary already drops its comparison from it.
		return items.map( item =>
			isComparison( data, item.seriesLabels?.[ 0 ] )
				? { ...item, seriesLabels: undefined, interactive: false, describesSeries: describes }
				: item
		);
	}

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
 * @param allData     - The chart's series; those the layout does not draw get no item.
 * @param options     - The legend options, and the layout the bars are drawn in.
 * @param legendShape - The shape of the legend swatches.
 * @return The legend items.
 */
export function useBarLegendItems(
	allData: SeriesData[],
	options: BarLegendOptions = {},
	legendShape?: LegendShape< SeriesData[], number >
): BaseLegendItem[] {
	const { layout } = options;
	const stacked = useMemo(
		() =>
			layout === 'stacked' ? getStackedLegendSeries( allData, options.comparisonItem ) : undefined,
		[ allData, layout, options.comparisonItem ]
	);
	const data = stacked?.series ?? allData;
	const getBarColors = useBarColors();
	const seriesColors = useMemo( () => {
		if ( ! layout ) {
			return undefined;
		}
		const colors = getBarColors( allData, { layout } );
		return stacked ? stacked.indexes.map( index => colors[ index ] ) : colors;
	}, [ allData, stacked, layout, getBarColors ] );
	const chartLegendOptions = useMemo(
		(): ChartLegendOptions => ( {
			...options,
			// A stacked layout lists its comparison total itself.
			...( stacked && { comparisonItem: false, comparisonSeriesItems: undefined } ),
			seriesColors,
		} ),
		[ options, stacked, seriesColors ]
	);
	const items = useChartLegendItems( data, chartLegendOptions, legendShape );

	return useMemo(
		() =>
			layout && seriesColors
				? forBarLayout( data, items, layout, seriesColors, stacked?.describes )
				: items,
		[ data, items, layout, seriesColors, stacked ]
	);
}
