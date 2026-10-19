/**
 * Internal dependencies
 */
import type { ComparativeLineChartSeries } from '../components/chart-comparative-line/types';

/**
 * Resolve each group's current-period series.
 *
 * Both tooltip naming and comparison-date alignment need the same definition
 * of a group's primary: its first non-comparison series.
 *
 * @param series - The series the chart was handed.
 * @return The current-period series keyed by group.
 */
export function resolvePrimarySeriesByGroup(
	series: readonly ComparativeLineChartSeries[]
): Map< string, ComparativeLineChartSeries > {
	const primarySeriesByGroup = new Map< string, ComparativeLineChartSeries >();

	for ( const item of series ) {
		if (
			item.options?.type !== 'comparison' &&
			item.group !== undefined &&
			! primarySeriesByGroup.has( item.group )
		) {
			primarySeriesByGroup.set( item.group, item );
		}
	}

	return primarySeriesByGroup;
}
