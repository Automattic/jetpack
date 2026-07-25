/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	flattenStatsLeaves,
	type StatsChartBucketPeriod,
	type StatsNormalizedReport,
	type StatsReferrersItem,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import type { ReferrerRecord } from './fields';

const GROUP_SEPARATOR = ' / ';

/**
 * Read a referrer item's display label.
 *
 * @param item - The referrer item.
 * @return The item label.
 */
function getReferrerLabel( item: StatsReferrersItem ): string {
	return String( item.label ?? '' );
}

/**
 * Flatten one bucket's referrer hierarchy into leaf table rows. DataViews does
 * not currently support nested table rows, so the parent path is retained in
 * the Group field instead.
 *
 * @param items - Top-level referrer items.
 * @return Flattened leaf rows.
 */
export function flattenReferrerRows( items: StatsReferrersItem[] ): ReferrerRecord[] {
	return flattenStatsLeaves< StatsReferrersItem, ReferrerRecord >( items, {
		getChildren: item => item.children,
		mapLeaf: ( item, { ancestors } ) => {
			const label = getReferrerLabel( item );
			const link = typeof item.link === 'string' ? item.link : undefined;
			const group = ancestors.map( getReferrerLabel ).filter( Boolean ).join( GROUP_SEPARATOR );
			// Leaves inherit the closest ancestor favicon, like the dashboard
			// widget (e.g. Google Search → google.com keeps the Google icon).
			const icon =
				item.icon ??
				[ ...ancestors ].reverse().find( ancestor => ancestor.icon )?.icon ??
				undefined;

			return {
				id: JSON.stringify( [ group, label, link ?? null ] ),
				label,
				group,
				views: item.views,
				link,
				icon,
			};
		},
	} );
}

/**
 * Build the views-over-time chart from daily referrers data.
 *
 * Top-level values already represent each group's complete total, so summing
 * that level avoids counting the same hierarchy at every nested level. Week
 * and month chart intervals are derived client-side so changing the chart does
 * not change the exact report window or the table totals.
 *
 * @param report - The bucketed referrers report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function referrersToTimeSeries(
	report: StatsNormalizedReport< StatsReferrersItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, item ) => total + item.views, 0 );

		return { value: views, views };
	} );
}

/**
 * Aggregate bucketed referrers into one table row per hierarchy leaf.
 *
 * @param report - The bucketed referrers report.
 * @return Aggregated table rows.
 */
export function aggregateReferrerRows(
	report?: StatsNormalizedReport< StatsReferrersItem >
): ReferrerRecord[] {
	const byKey = new Map< string, ReferrerRecord >();

	for ( const point of report?.data ?? [] ) {
		for ( const row of flattenReferrerRows( point.items ) ) {
			const existing = byKey.get( row.id );

			if ( existing ) {
				existing.views += row.views;
			} else {
				byKey.set( row.id, { ...row } );
			}
		}
	}

	return [ ...byKey.values() ];
}
