/**
 * External dependencies
 */
import type {
	StatsNormalizedReport,
	StatsPeriod,
	StatsTimeSeriesReport,
	StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';

type VideoChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date onto its chart bucket key for the selected period —
 * the date itself for days, the start of the ISO week for weeks, and the
 * `YYYY-MM` month prefix for months.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
function getChartBucketKey( date: string, period: VideoChartPeriod ): string {
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
	period: VideoChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();

	for ( const point of report?.data ?? [] ) {
		const plays = point.items.reduce( ( total, item ) => total + item.plays, 0 );
		const key = getChartBucketKey( point.time_interval, period );
		const existing = buckets.get( key );

		if ( existing ) {
			existing.date_end = point.date_end;
			existing.value = Number( existing.value ) + plays;
			existing.plays = Number( existing.plays ) + plays;
			continue;
		}

		buckets.set( key, {
			time_interval: key,
			date_start: point.date_start,
			date_end: point.date_end,
			label: key,
			items: [],
			value: plays,
			plays,
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
