/**
 * External dependencies
 */
import {
	useChartLegendItems,
	type BaseLegendItem,
	type SeriesData,
} from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';

type LegendOptions = Parameters< typeof useChartLegendItems >[ 1 ];
type LegendShape = Parameters< typeof useChartLegendItems >[ 2 ];

/**
 * The chart's own legend items, with the first one pinned visible: it is the metric the
 * reader picked, and the Comparison period swatch borrows its color.
 *
 * @param data    - The series the chart draws
 * @param options - The chart's `legend` config
 * @param shape   - The legend shape, when the chart's default is not `rect`
 * @return Legend items to hand to `LineChart.Legend` / `BarChart.Legend`
 */
export function useLockedPrimaryLegendItems(
	data: SeriesData[],
	options: LegendOptions,
	shape?: LegendShape
): BaseLegendItem[] {
	const items = useChartLegendItems( data, options, shape );

	return useMemo(
		() => ( items.length ? [ { ...items[ 0 ], interactive: false }, ...items.slice( 1 ) ] : items ),
		[ items ]
	);
}
