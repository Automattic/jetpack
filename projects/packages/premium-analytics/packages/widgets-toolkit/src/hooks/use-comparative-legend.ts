/**
 * External dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useLockedPrimaryLegendItems } from './use-locked-primary-legend-items';
import type { BarChartLayout, SeriesData } from '@jetpack-premium-analytics/externals';

type LegendShape = Parameters< typeof useLockedPrimaryLegendItems >[ 2 ];

/**
 * A comparative chart's legend: each metric, then each metric's previous period,
 * named by `comparisonLabel`.
 *
 * @param series          - The series the chart draws.
 * @param interactive     - Whether the reader can show and hide metrics from the legend.
 * @param comparisonLabel - The comparison's legend name, e.g. "Prev. 30 days".
 * @param shape           - The legend shape, when the chart's default is not `rect`.
 * @param barLayout       - The bar chart layout whose bar colors the swatches take, if any.
 * @param primaryLabel    - The label of the metric the reader picked, when it is not the first series drawn.
 * @return The config to hand the chart, the items to hand its legend, and the comparison's name.
 */
export function useComparativeLegend(
	series: SeriesData[],
	interactive: boolean,
	comparisonLabel: string = __( 'Previous period', 'jetpack-premium-analytics-pkg' ),
	shape?: LegendShape,
	barLayout?: BarChartLayout,
	primaryLabel?: string
) {
	const config = useMemo(
		() => ( {
			collapseGroups: true,
			interactive,
			comparisonSeriesItems: ( metric: string ) =>
				sprintf(
					/* translators: 1: metric name, e.g. "Views"; 2: comparison period, e.g. "Prev. 30 days". */
					_x( '%1$s (%2$s)', 'metric with its comparison period', 'jetpack-premium-analytics-pkg' ),
					metric,
					comparisonLabel
				),
		} ),
		[ interactive, comparisonLabel ]
	);
	const itemOptions = useMemo( () => ( { ...config, layout: barLayout } ), [ config, barLayout ] );
	const items = useLockedPrimaryLegendItems( series, itemOptions, shape, primaryLabel );

	return { config, items, comparisonLabel };
}
