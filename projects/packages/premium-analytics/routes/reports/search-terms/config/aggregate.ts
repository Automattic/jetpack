/**
 * External dependencies
 */
import {
	mergeStatsComparisonRows,
	type StatsNormalizedDataPoint,
	type StatsNormalizedReport,
	type StatsSearchTermsItem,
} from '@jetpack-premium-analytics/data';

/**
 * A row in the Search terms records table.
 */
export type SearchTermRow = {
	id: string;
	term: string;
	views: number;
	previousViews?: number;
};

type SearchTermsDataPoint = StatsNormalizedDataPoint< StatsSearchTermsItem > & {
	encrypted_search_terms?: unknown;
};

type AggregateSingleReportOptions = {
	includeZeroEncrypted?: boolean;
};

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
 * Aggregate one bucketed report into table rows.
 *
 * @param report                       - The bucketed search-terms report.
 * @param unknownLabel                 - Translated label for encrypted search terms.
 * @param options                      - Aggregation behavior.
 * @param options.includeZeroEncrypted - Keep an explicit zero encrypted count for matching.
 * @return Aggregated rows for one report period.
 */
function aggregateSingleSearchTermReport(
	report: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	unknownLabel: string,
	{ includeZeroEncrypted = false }: AggregateSingleReportOptions = {}
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

	if ( encryptedViews > 0 || ( includeZeroEncrypted && hasEncryptedViews ) ) {
		rows.push( { id: 'unknown-search-terms', term: unknownLabel, views: encryptedViews } );
	}

	return rows;
}

/**
 * Aggregate and match Search terms rows across the current and comparison periods.
 *
 * Terms are summed before matching because the report intentionally stays
 * day-bucketed to preserve encrypted search counts. The encrypted aggregate is
 * represented by the stable "Unknown search terms" row and participates in
 * comparison matching like a regular term.
 *
 * @param primaryReport    - The current bucketed search-terms report.
 * @param unknownLabel     - Translated label for encrypted search terms.
 * @param comparisonReport - The comparison bucketed search-terms report, when enabled.
 * @return Comparison-aware rows and whether any visible row has a previous value.
 */
export function aggregateSearchTermRows(
	primaryReport: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	unknownLabel: string,
	comparisonReport?: StatsNormalizedReport< StatsSearchTermsItem >
): { rows: SearchTermRow[]; hasComparison: boolean } {
	return mergeStatsComparisonRows< SearchTermRow, SearchTermRow, SearchTermRow >( {
		primaryRows: aggregateSingleSearchTermReport( primaryReport, unknownLabel ),
		// Preserve an explicit comparison zero so a current encrypted row still
		// renders the shared delta fallback instead of looking unmatched.
		comparisonRows: aggregateSingleSearchTermReport( comparisonReport, unknownLabel, {
			includeZeroEncrypted: true,
		} ),
		getPrimaryKey: row => row.id,
		getComparisonKey: row => row.id,
		getComparisonValue: row => row.views,
		mapRow: ( row, { previousValue } ) => ( {
			...row,
			...( previousValue !== undefined ? { previousViews: previousValue } : {} ),
		} ),
	} );
}
