/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ComparativeLineChartSeries } from '@automattic/jetpack-premium-analytics-widgets-toolkit/src/components/chart-comparative-line';
import type { SanitizedStatsVisits } from '@jetpack-premium-analytics/data';

/**
 * Metrics charted as parallel series, in series order (Views primary,
 * Visitors secondary). Matches Calypso's default Views tab.
 */
const METRICS: Array< { key: 'views' | 'visitors'; label: string } > = [
	{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) },
	{ key: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
];

/**
 * Build line-chart series from a sanitized visits report — one series per
 * metric, sharing the same period (X) values.
 *
 * Both series are `group: 'primary'`: Views and Visitors are parallel metrics,
 * not a primary/comparison pair. The ported toolkit's index-based comparison
 * semantics (date realignment in `align-series-dates`, `realDate` tooltip
 * labels for `index > 0`) are inert here because every series shares identical
 * `date_start` values — alignment is a no-op and `realDate` is never set.
 * A real comparison period or a third metric would need that revisited.
 *
 * @param report - Sanitized visits report, or undefined while loading.
 * @return One `ComparativeLineChartSeries` per metric, or `[]` when there's no data.
 */
export function buildVisitsSeries( report?: SanitizedStatsVisits ): ComparativeLineChartSeries[] {
	const rows = report?.data ?? [];

	if ( ! rows.length ) {
		return [];
	}

	return METRICS.map( ( { key, label } ) => ( {
		label,
		group: 'primary',
		data: rows.map( row => ( {
			date: localTZDate( row.date_start ),
			value: Number( row[ key ] ?? 0 ),
		} ) ),
		options: {},
	} ) );
}
