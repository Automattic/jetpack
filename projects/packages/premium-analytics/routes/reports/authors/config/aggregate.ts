/**
 * External dependencies
 */
import type {
	StatsNormalizedReport,
	StatsPeriod,
	StatsTimeSeriesReport,
	StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';

type AuthorChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

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
 * Map a daily bucket date onto its chart bucket key for the selected period —
 * the date itself for days, the start of the ISO week for weeks, and the
 * first-of-month date (`YYYY-MM-01`) for months.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
export function getChartBucketKey( date: string, period: AuthorChartPeriod ): string {
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
	period: AuthorChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( first, second ) =>
		first.time_interval.localeCompare( second.time_interval )
	);

	for ( const point of points ) {
		const views = point.items.reduce( ( total, author ) => total + author.views, 0 );
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
