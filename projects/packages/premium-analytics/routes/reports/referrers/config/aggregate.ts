/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
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
 * Build one table row for every leaf in a referrer hierarchy. DataViews does
 * not currently support nested table rows, so the parent path is retained in
 * the Group field instead.
 *
 * @param item       - The current referrer item.
 * @param parentPath - Parent labels from the report root to this item.
 * @return Flattened leaf rows.
 */
function flattenReferrerItem( item: StatsReferrersItem, parentPath: string[] ): ReferrerRecord[] {
	const label = String( item.label ?? '' );
	const children = item.children ?? [];

	if ( children.length ) {
		const nextPath = label ? [ ...parentPath, label ] : parentPath;

		return children.flatMap( child => flattenReferrerItem( child, nextPath ) );
	}

	const link = typeof item.link === 'string' ? item.link : undefined;
	const group = parentPath.join( GROUP_SEPARATOR );
	const id = JSON.stringify( [ group, label, link ?? null ] );

	return [
		{
			id,
			label,
			group,
			views: item.views,
			link,
		},
	];
}

/**
 * Flatten one bucket's referrer hierarchy into leaf table rows.
 *
 * @param items - Top-level referrer items.
 * @return Flattened leaf rows.
 */
export function flattenReferrerRows( items: StatsReferrersItem[] ): ReferrerRecord[] {
	return items.flatMap( item => flattenReferrerItem( item, [] ) );
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
