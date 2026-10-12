/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useLockedPrimaryLegendItems } from './use-locked-primary-legend-items';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

type LegendShape = Parameters< typeof useLockedPrimaryLegendItems >[ 2 ];

/**
 * A comparative chart's legend: each metric, then each metric's previous period
 * named after the comparison the reader picked.
 *
 * @param series          - The series the chart draws.
 * @param interactive     - Whether the reader can show and hide metrics from the legend.
 * @param comparisonLabel - The comparison's legend name, e.g. "Prev. 30 days".
 * @param shape           - The legend shape, when the chart's default is not `rect`.
 * @return The config to hand the chart and the items to hand its legend.
 */
export function useComparativeLegend(
	series: SeriesData[],
	interactive: boolean,
	comparisonLabel: string = __( 'Previous period', 'jetpack-premium-analytics-pkg' ),
	shape?: LegendShape
) {
	const config = useMemo(
		() => ( {
			collapseGroups: true as const,
			interactive,
			comparisonItem: ( metric: string ) =>
				sprintf(
					/* translators: 1: metric name, e.g. "Views"; 2: comparison period, e.g. "Prev. 30 days". */
					__( '%1$s (%2$s)', 'jetpack-premium-analytics-pkg' ),
					metric,
					comparisonLabel
				),
		} ),
		[ interactive, comparisonLabel ]
	);
	const items = useLockedPrimaryLegendItems( series, config, shape );

	return { config, items };
}
