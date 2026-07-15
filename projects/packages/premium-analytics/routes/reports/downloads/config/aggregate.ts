/**
 * Internal dependencies
 */
import type {
	StatsFileDownloadsItem,
	StatsNormalizedReport,
	StatsPeriod,
	StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

type DownloadChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date to its chart bucket key.
 *
 * @param date   - The daily bucket date.
 * @param period - The chart bucket period.
 * @return The chart bucket key.
 */
export function getChartBucketKey( date: string, period: DownloadChartPeriod ): string {
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
 * Stable identity for a file-download row across report buckets.
 *
 * @param item - A normalized file-download item.
 * @return The row identity.
 */
function getFileKey( item: StatsFileDownloadsItem ): string {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

/**
 * Convert a daily file-downloads report into downloads per chart interval.
 *
 * @param report - The bucketed file-downloads report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function downloadsToTimeSeries(
	report: StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
	period: DownloadChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( a, b ) =>
		a.time_interval.localeCompare( b.time_interval )
	);

	for ( const point of points ) {
		const downloads = point.items.reduce( ( total, item ) => total + item.downloads, 0 );
		const key = getChartBucketKey( point.time_interval, period );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;
			existing.value = Number( existing.value ) + downloads;
			existing.downloads = Number( existing.downloads ) + downloads;
			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: point.date_start,
			date_end: point.date_end,
			label: key,
			items: [],
			value: downloads,
			downloads,
		} );
	}

	const data = [ ...buckets.values() ].sort( ( a, b ) =>
		a.time_interval.localeCompare( b.time_interval )
	);
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
 * Aggregate a bucketed report into one row per file, summing downloads.
 *
 * @param report - The bucketed file-downloads report.
 * @return Aggregated file rows.
 */
export function aggregateDownloadRows(
	report: StatsNormalizedReport< StatsFileDownloadsItem > | undefined
): StatsFileDownloadsItem[] {
	const byFile = new Map< string, StatsFileDownloadsItem >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const key = getFileKey( item );
			const existing = byFile.get( key );

			if ( existing ) {
				existing.downloads += item.downloads;
			} else {
				// Do not mutate normalized report data held in the query cache.
				byFile.set( key, { ...item } );
			}
		}
	}

	return [ ...byFile.values() ];
}
