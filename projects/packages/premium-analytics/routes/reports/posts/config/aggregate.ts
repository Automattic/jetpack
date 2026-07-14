/**
 * Internal dependencies
 */
import { flattenArchiveRows, type ArchiveRow } from './fields';
import type {
	StatsArchivesItem,
	StatsNormalizedItem,
	StatsNormalizedReport,
	StatsTimeSeriesReport,
	StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

/**
 * The report pages fetch each tab's module report without `summarize`, so the
 * response arrives as per-interval buckets (one data point per day/week/month
 * with that bucket's rows). One query then feeds both page sections:
 *
 * - the performance chart, by summing each bucket's rows into a time series;
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
 * Build a chart time series from a bucketed report.
 *
 * The query owns the bucket size (`period=day|week|month`), and the normalizer
 * resolves each bucket's `date_start` / `date_end`. The report page only sums
 * each bucket's rows for the chart metric.
 *
 * @param report - The bucketed module report.
 * @param sum    - Sums one bucket's rows into the bucket's value.
 * @return The chart-ready time series.
 */
function toTimeSeries< TItem extends StatsNormalizedItem >(
	report: StatsNormalizedReport< TItem > | undefined,
	sum: ( items: TItem[] ) => number
): StatsTimeSeriesReport {
	const data = ( report?.data ?? [] ).map( point => {
		const views = sum( point.items );

		return {
			time_interval: point.time_interval,
			date_start: point.date_start,
			date_end: point.date_end,
			label: point.time_interval,
			items: [],
			value: views,
			views,
		};
	} );
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
 * Views-per-bucket time series for the Posts & Pages tab.
 *
 * @param report - The bucketed top-posts report.
 * @return The chart-ready time series.
 */
export function postsToTimeSeries(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined
): StatsTimeSeriesReport {
	return toTimeSeries( report, items => items.reduce( ( total, item ) => total + item.views, 0 ) );
}

/**
 * Views-per-bucket time series for the Archives tab.
 *
 * @param report - The bucketed archives report.
 * @return The chart-ready time series.
 */
export function archivesToTimeSeries(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined
): StatsTimeSeriesReport {
	return toTimeSeries( report, items =>
		flattenArchiveRows( items ).reduce( ( total, row ) => total + row.views, 0 )
	);
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
