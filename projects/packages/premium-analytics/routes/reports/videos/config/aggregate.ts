/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
	type StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';

/**
 * Resolve the stable identity shared by a video across report buckets.
 *
 * @param video - The normalized video row.
 * @return The video's stable row key.
 */
export function getVideoRowId( video: StatsVideoPlaysItem ): string {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || String( video.label ?? '' );
}

/**
 * Build the chart's plays-per-bucket time series from daily video data.
 *
 * The endpoint's documented `num` query form returns genuine daily buckets.
 * Keeping that request fixed at `period=day` preserves the exact selected
 * range; week and month chart intervals are derived from those daily points
 * without changing the records that feed the table.
 *
 * @param report - The bucketed video-plays report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function videosToTimeSeries(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const plays = point.items.reduce( ( total, item ) => total + item.plays, 0 );

		return { value: plays, plays };
	} );
}

/**
 * Aggregate one bucketed report into one table row per video, summing the
 * metrics returned by the video-plays payload without mutating query data.
 *
 * @param report - The bucketed video-plays report.
 * @return The aggregated video rows.
 */
export function aggregateVideoRows(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): StatsVideoPlaysItem[] {
	const byKey = new Map< string, StatsVideoPlaysItem >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const key = getVideoRowId( item );
			const existing = byKey.get( key );

			if ( existing ) {
				existing.plays += item.plays;
				existing.impressions += item.impressions;
			} else {
				byKey.set( key, { ...item } );
			}
		}
	}

	return [ ...byKey.values() ];
}
