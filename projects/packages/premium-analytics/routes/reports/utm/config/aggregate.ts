import type { StatsNormalizedReport, StatsUtmItem } from '@jetpack-premium-analytics/data';

/** A single UTM value aggregated across the selected report range. */
export type UtmReportRow = {
	id: string;
	label: string;
	views: number;
};

/**
 * Flatten a normalized UTM report into one row per UTM value.
 *
 * The current endpoint returns one range-level data point. Aggregating across
 * every point keeps this transform correct if the normalizer later exposes
 * bucketed responses, without mutating data held in the query cache.
 *
 * @param report - The normalized UTM report.
 * @return Aggregated UTM value rows.
 */
export function aggregateUtmRows( report?: StatsNormalizedReport< StatsUtmItem > ): UtmReportRow[] {
	// Key rows by the raw UTM tuple, not the display label: distinct tuples such as
	// `["a / b","c"]` and `["a","b / c"]` format to the same label but are separate rows.
	const byParamValues = new Map< string, UtmReportRow >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const label = String( item.label ?? '' );
			const key = item.paramValues ?? label;
			const existing = byParamValues.get( key );

			if ( existing ) {
				existing.views += item.value;
			} else {
				byParamValues.set( key, { id: key, label, views: item.value } );
			}
		}
	}

	return [ ...byParamValues.values() ];
}
