/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SanitizedStatsVisits } from '@jetpack-premium-analytics/data';
import type { ComparativeLineChartSeries } from '../components/chart-comparative-line';

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
