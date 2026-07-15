/**
 * Internal dependencies
 */
import type { ReferrerRecord } from './fields';
import type {
	StatsNormalizedReport,
	StatsPeriod,
	StatsReferrersItem,
	StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

const GROUP_SEPARATOR = ' / ';
type ReferrerChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date onto its chart bucket key for the selected period —
 * the date itself for days, the start of the ISO week for weeks, and the
 * first-of-month date (`YYYY-MM-01`) for months.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
function getChartBucketKey( date: string, period: ReferrerChartPeriod ): string {
	if ( period === 'day' ) {
		return date;
	}

	const bucketDate = new Date( `${ date.slice( 0, 10 ) }T00:00:00Z` );

	if ( period === 'week' ) {
		const daysSinceMonday = ( bucketDate.getUTCDay() + 6 ) % 7;
		bucketDate.setUTCDate( bucketDate.getUTCDate() - daysSinceMonday );
	} else {
		bucketDate.setUTCDate( 1 );
	}

	return bucketDate.toISOString().slice( 0, 10 );
}

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
	period: ReferrerChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( a, b ) =>
		a.time_interval.localeCompare( b.time_interval )
	);

	for ( const point of points ) {
		const views = point.items.reduce( ( total, item ) => total + item.views, 0 );
		const key = getChartBucketKey( point.time_interval, period );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;
			existing.value = Number( existing.value ) + views;
			existing.views = Number( existing.views ) + views;
			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: point.date_start,
			date_end: point.date_end,
			label: key,
			items: [],
			value: views,
			views,
		} );
	}

	const data = [ ...buckets.values() ];
	const first = data[ 0 ];
	const last = data[ data.length - 1 ];

	return {
		summary: {
			...report?.summary,
			...( first ? { date_start: first.date_start } : {} ),
			...( last ? { date_end: last.date_end } : {} ),
		},
		data,
	};
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
