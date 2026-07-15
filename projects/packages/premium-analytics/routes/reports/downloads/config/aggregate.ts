/**
 * Internal dependencies
 */
import type {
	StatsFileDownloadsItem,
	StatsNormalizedReport,
	StatsTimeSeriesReport,
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
 * Convert a bucketed file-downloads report into downloads per interval.
 *
 * @param report - The bucketed file-downloads report.
 * @return The chart-ready time series.
 */
export function downloadsToTimeSeries(
	report: StatsNormalizedReport< StatsFileDownloadsItem > | undefined
): StatsTimeSeriesReport {
	const data = ( report?.data ?? [] ).map( point => {
		const downloads = point.items.reduce( ( total, item ) => total + item.downloads, 0 );

		return {
			time_interval: point.time_interval,
			date_start: point.date_start,
			date_end: point.date_end,
			label: point.time_interval,
			items: [],
			value: downloads,
			downloads,
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
