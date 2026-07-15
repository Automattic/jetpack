/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
	type StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';

/**
 * One author row in the report table. Nested post children are intentionally
 * omitted: the first version of the report shows one aggregate row per author.
 */
export type AuthorRow = {
	id: string;
	name: string;
	avatarUrl: string | null;
	views: number;
};

/**
 * Build a period-independent key for an author. The endpoint normally provides
 * an author id; label plus avatar keeps anonymous/fallback authors aligned
 * across buckets when it does not.
 *
 * @param author - A normalized top-authors item.
 * @return The author's stable aggregation key.
 */
function getAuthorKey( author: StatsTopAuthorsItem ): string {
	if ( author.id != null ) {
		return `id:${ String( author.id ) }`;
	}

	return `label:${ String( author.label ?? '' ) }|${ author.icon ?? '' }`;
}

/**
 * Convert a daily top-authors report into the views-per-bucket series used by
 * the performance chart.
 *
 * @param report - The bucketed top-authors report.
 * @param period - The chart bucket period.
 * @return The chart-ready views time series.
 */
export function authorsToTimeSeries(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, author ) => total + author.views, 0 );

		return { value: views, views };
	} );
}

/**
 * Aggregate a bucketed top-authors report into one table row per author,
 * summing views across all buckets without retaining nested post children.
 *
 * @param report - The bucketed top-authors report.
 * @return The aggregate author rows.
 */
export function aggregateAuthorRows(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): AuthorRow[] {
	const rows = new Map< string, AuthorRow >();

	for ( const point of report?.data ?? [] ) {
		for ( const author of point.items ) {
			const key = getAuthorKey( author );
			const existing = rows.get( key );

			if ( existing ) {
				existing.views += author.views;
			} else {
				rows.set( key, {
					id: key,
					name: String( author.label ?? '' ),
					avatarUrl: author.icon,
					views: author.views,
				} );
			}
		}
	}

	return [ ...rows.values() ];
}
