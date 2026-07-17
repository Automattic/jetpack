/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsArchivesItem,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { flattenArchiveRows, type ArchiveRow } from './fields';

/**
 * The report pages fetch each tab's module report without `summarize`, so the
 * response arrives as daily buckets. One query then feeds both page sections:
 *
 * - the performance chart, by grouping daily buckets client-side;
 * - the records table, by aggregating the rows across buckets.
 *
 * Deriving both from the same report keeps the chart scoped to exactly the
 * records listed below it — a site-wide series (or a separately summarized
 * report) would count views the table doesn't show.
 *
 * With `skip_archives=1`, top posts includes the homepage-only row while
 * archives omits its home group, so no cross-tab filtering is needed.
 */

/**
 * Build the chart's views-per-bucket time series for the Posts & Pages tab
 * from daily top-posts data.
 *
 * @param report - The daily top-posts report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function postsToTimeSeries(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, item ) => total + item.views, 0 );

		return { value: views, views };
	} );
}

/**
 * Build the chart's views-per-bucket time series for the Archives tab from
 * daily archives data.
 *
 * @param report - The daily archives report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function archivesToTimeSeries(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = flattenArchiveRows( point.items ).reduce(
			( total, row ) => total + row.views,
			0
		);

		return { value: views, views };
	} );
}

/**
 * Aggregate the bucketed top-posts report into one table row per post/page or
 * homepage, summing views across buckets.
 *
 * @param report - The bucketed top-posts report.
 * @return The table rows.
 */
export function aggregatePostRows(
	report?: StatsNormalizedReport< StatsTopPostsItem >
): StatsTopPostsItem[] {
	const byKey = new Map< string, StatsTopPostsItem >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const key = String( item.id ?? item.label );
			const existing = byKey.get( key );

			if ( existing ) {
				existing.views += item.views;
			} else {
				// Clone so summing never mutates the normalized report in the
				// query cache.
				byKey.set( key, { ...item } );
			}
		}
	}

	return [ ...byKey.values() ];
}

/**
 * Aggregate the bucketed archives report into one table row per archive
 * entry, summing views across buckets.
 *
 * @param report - The bucketed archives report.
 * @return The table rows.
 */
export function aggregateArchiveRows(
	report?: StatsNormalizedReport< StatsArchivesItem >
): ArchiveRow[] {
	const byKey = new Map< string, ArchiveRow >();

	for ( const point of report?.data ?? [] ) {
		for ( const row of flattenArchiveRows( point.items ) ) {
			// The flat row ids are positional within one bucket; key across
			// buckets by identity instead.
			const key = `${ row.label }|${ row.link ?? '' }`;
			const existing = byKey.get( key );

			if ( existing ) {
				existing.views += row.views;
			} else {
				byKey.set( key, { ...row, id: key } );
			}
		}
	}

	return [ ...byKey.values() ];
}
