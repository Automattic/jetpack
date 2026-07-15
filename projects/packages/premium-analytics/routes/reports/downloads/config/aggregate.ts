/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsFileDownloadsItem,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

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
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const downloads = point.items.reduce( ( total, item ) => total + item.downloads, 0 );

		return { value: downloads, downloads };
	} );
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
