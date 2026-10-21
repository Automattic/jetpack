/**
 * External dependencies
 */
import {
	useBarLegendItems,
	type BaseLegendItem,
	type SeriesData,
} from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';

type LegendOptions = Parameters< typeof useBarLegendItems >[ 1 ];
type LegendShape = Parameters< typeof useBarLegendItems >[ 2 ];

/**
 * The chart's own legend items, with the primary one first and pinned visible: it is the metric the
 * reader picked, and locking it keeps the chart from ever being emptied.
 *
 * @param data         - The series the chart draws
 * @param options      - The chart's `legend` config, and the bar layout when the chart draws bars
 * @param shape        - The legend shape, when the chart's default is not `rect`
 * @param primaryLabel - The label of the series the reader picked, when it is not the first one drawn
 * @return Legend items to hand to `LineChart.Legend` / `BarChart.Legend`
 */
export function useLockedPrimaryLegendItems(
	data: SeriesData[],
	options: LegendOptions,
	shape?: LegendShape,
	primaryLabel?: string
): BaseLegendItem[] {
	const items = useBarLegendItems( data, options, shape );

	return useMemo( () => {
		const primaryIndex = Math.max(
			0,
			items.findIndex( item => item.label === primaryLabel )
		);
		const primary = items[ primaryIndex ];

		return primary
			? [
					{ ...primary, interactive: false },
					...items.filter( ( _item, index ) => index !== primaryIndex ),
				]
			: items;
	}, [ items, primaryLabel ] );
}
