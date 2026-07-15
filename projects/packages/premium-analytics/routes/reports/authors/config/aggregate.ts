/**
 * External dependencies
 */
import type {
	StatsNormalizedReport,
	StatsTimeSeriesReport,
	StatsTopAuthorsItem,
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
 * Convert a bucketed top-authors report into the views-per-bucket series used
 * by the performance chart.
 *
 * @param report - The bucketed top-authors report.
 * @return The chart-ready views time series.
 */
export function authorsToTimeSeries(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): StatsTimeSeriesReport {
	const data = ( report?.data ?? [] ).map( point => {
		const views = point.items.reduce( ( total, author ) => total + author.views, 0 );

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
