/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { addDays, format, startOfMonth, startOfWeek } from 'date-fns';
/**
 * Internal dependencies
 */
import { flattenArchiveRows, type ArchiveRow } from './fields';
import type {
	IntervalType,
	StatsArchivesItem,
	StatsNormalizedReport,
	StatsTimeSeriesReport,
	StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

/**
 * The window a chart series covers: the report range plus the bucket size the
 * user picked with the chart's interval control.
 */
export type ChartWindow = {
	from: string;
	to: string;
	interval: IntervalType;
};

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
 */

/**
 * Whether a top-posts row is an actual post/page. The endpoint mixes in a
 * synthetic "Home page / Archives" aggregate, which belongs to the Archives
 * tab.
 *
 * @param item - The top-posts row.
 * @return Whether the row is a post/page.
 */
export function isPostRow( item: StatsTopPostsItem ): boolean {
	return item.type !== 'homepage';
}

/**
 * Build a chart time series from a daily-bucketed report.
 *
 * The report is fetched with `period: 'day'`, so its data points are days —
 * but only days with rows (the sanitizers drop empty buckets, which would
 * leave the chart a few disconnected points). This zero-fills every day of
 * the window and then groups the days into the interval the chart control
 * selected, so the series always spans the full range with the right bucket
 * size.
 *
 * @param report - The daily-bucketed module report.
 * @param sum    - Sums one day's rows into the day's value.
 * @param window - The report range and chart bucket size.
 * @return The chart-ready time series.
 */
function toTimeSeries< TItem >(
	report: { data: Array< { time_interval: string; items: TItem[] } > } | undefined,
	sum: ( items: TItem[] ) => number,
	window: ChartWindow
): StatsTimeSeriesReport {
	const viewsByDay = new Map< string, number >();
	for ( const point of report?.data ?? [] ) {
		const day = point.time_interval.slice( 0, 10 );
		viewsByDay.set( day, ( viewsByDay.get( day ) ?? 0 ) + sum( point.items ) );
	}

	const start = localTZDate( window.from );
	const end = localTZDate( window.to );
	const buckets = new Map< string, { views: number; date_start: string; date_end: string } >();

	for ( let date = start; date <= end; date = addDays( date, 1 ) ) {
		let bucketStart = date;
		if ( window.interval === 'week' ) {
			bucketStart = startOfWeek( date, { weekStartsOn: 1 } );
		} else if ( window.interval === 'month' ) {
			bucketStart = startOfMonth( date );
		}

		const key = format( bucketStart, 'yyyy-MM-dd' );
		const day = format( date, 'yyyy-MM-dd' );
		const bucket = buckets.get( key ) ?? { views: 0, date_start: key, date_end: day };
		bucket.views += viewsByDay.get( day ) ?? 0;
		bucket.date_end = day;
		buckets.set( key, bucket );
	}

	const data = [ ...buckets.values() ].map( bucket => ( {
		time_interval: bucket.date_start,
		date_start: bucket.date_start,
		date_end: bucket.date_end,
		label: bucket.date_start,
		items: [],
		value: bucket.views,
		views: bucket.views,
	} ) );

	return { summary: {}, data };
}

/**
 * Views-per-bucket time series for the Posts & Pages tab.
 *
 * @param report - The daily-bucketed top-posts report.
 * @param window - The report range and chart bucket size.
 * @return The chart-ready time series.
 */
export function postsToTimeSeries(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	window: ChartWindow
): StatsTimeSeriesReport {
	return toTimeSeries(
		report,
		items => items.filter( isPostRow ).reduce( ( total, item ) => total + item.views, 0 ),
		window
	);
}

/**
 * Views-per-bucket time series for the Archives tab.
 *
 * @param report - The daily-bucketed archives report.
 * @param window - The report range and chart bucket size.
 * @return The chart-ready time series.
 */
export function archivesToTimeSeries(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined,
	window: ChartWindow
): StatsTimeSeriesReport {
	return toTimeSeries(
		report,
		items => flattenArchiveRows( items ).reduce( ( total, row ) => total + row.views, 0 ),
		window
	);
}

/**
 * Aggregate the bucketed top-posts report into one table row per post/page,
 * summing views across buckets.
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
			if ( ! isPostRow( item ) ) {
				continue;
			}

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
