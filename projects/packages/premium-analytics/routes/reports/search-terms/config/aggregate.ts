/**
 * External dependencies
 */
import type {
	StatsNormalizedDataPoint,
	StatsNormalizedReport,
	StatsPeriod,
	StatsSearchTermsItem,
	StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';

/**
 * A row in the Search terms records table.
 */
export type SearchTermRow = {
	id: string;
	term: string;
	views: number;
};

type SearchTermsDataPoint = StatsNormalizedDataPoint< StatsSearchTermsItem > & {
	encrypted_search_terms?: unknown;
};

type SearchTermsChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Map a daily bucket date onto its chart bucket key for the selected period.
 *
 * @param date   - The daily bucket date (`YYYY-MM-DD`).
 * @param period - The chart bucket period.
 * @return The bucket key the date aggregates into.
 */
function getChartBucketKey( date: string, period: SearchTermsChartPeriod ): string {
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
 * Read the aggregate encrypted-search count that the Stats payload stores
 * beside a bucket's known `search_terms` array.
 *
 * @param point - A normalized search-terms bucket.
 * @return The encrypted search count when present.
 */
function getEncryptedSearchTerms( point: SearchTermsDataPoint ): number | undefined {
	const value = point.encrypted_search_terms;
	const count = typeof value === 'number' ? value : Number( value );

	return value !== undefined && Number.isFinite( count ) ? count : undefined;
}

/**
 * Normalize an API term label to table text.
 *
 * @param item - A normalized search-term item.
 * @return The term label.
 */
function getTermLabel( item: StatsSearchTermsItem ): string {
	return typeof item.label === 'string' ? item.label : String( item.label );
}

/**
 * Build the chart's views-per-bucket series from daily search-terms data.
 * Known-term views and the encrypted aggregate are both included so the chart
 * represents the same records shown in the table. Week and month intervals are
 * derived client-side so changing the chart does not change the requested range.
 *
 * @param report - The bucketed search-terms report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function searchTermsToTimeSeries(
	report: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	period: SearchTermsChartPeriod = 'day'
): StatsTimeSeriesReport {
	const buckets = new Map< string, StatsTimeSeriesReport[ 'data' ][ number ] >();
	const points = [ ...( report?.data ?? [] ) ].sort( ( a, b ) =>
		a.time_interval.localeCompare( b.time_interval )
	);

	for ( const point of points ) {
		const knownViews = point.items.reduce( ( total, item ) => total + item.views, 0 );
		const views = knownViews + ( getEncryptedSearchTerms( point ) ?? 0 );
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
 * Aggregate bucketed search terms into one row per known term plus one regular
 * row for the encrypted aggregate. The caller supplies the translated label
 * so this transform stays independent of i18n state.
 *
 * @param report       - The bucketed search-terms report.
 * @param unknownLabel - Translated label for encrypted search terms.
 * @return Search-term table rows.
 */
export function aggregateSearchTermRows(
	report: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	unknownLabel: string
): SearchTermRow[] {
	const byTerm = new Map< string, SearchTermRow >();
	let encryptedViews = 0;
	let hasEncryptedViews = false;

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const term = getTermLabel( item );
			const existing = byTerm.get( term );

			if ( existing ) {
				existing.views += item.views;
			} else {
				byTerm.set( term, { id: `term:${ term }`, term, views: item.views } );
			}
		}

		const bucketEncryptedViews = getEncryptedSearchTerms( point );
		if ( bucketEncryptedViews !== undefined ) {
			hasEncryptedViews = true;
			encryptedViews += bucketEncryptedViews;
		}
	}

	const rows = [ ...byTerm.values() ];

	if ( hasEncryptedViews ) {
		rows.push( { id: 'unknown-search-terms', term: unknownLabel, views: encryptedViews } );
	}

	return rows;
}
