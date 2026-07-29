/**
 * External dependencies
 */
import {
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

/**
 * Read a finite count without losing an explicit zero.
 *
 * @param value - The raw Stats count.
 * @return The numeric count when present and finite.
 */
function getCount( value: unknown ): number | undefined {
	const count = typeof value === 'number' ? value : Number( value );

	return value !== undefined && Number.isFinite( count ) ? count : undefined;
}

/**
 * Read the aggregate encrypted-search count that the Stats payload stores
 * beside a bucket's known `search_terms` array.
 *
 * @param point - A normalized search-terms bucket.
 * @return The encrypted search count when present.
 */
function getEncryptedSearchTerms( point: SearchTermsDataPoint ): number | undefined {
	return getCount( point.encrypted_search_terms );
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
 * Summary responses already contain one range-wide encrypted-search count.
 * Prefer it over bucket metadata so the Unknown row follows the API contract
 * without folding `other_search_terms` into it.
 *
 * @param report       - The search-terms report.
 * @param unknownLabel - Translated label for encrypted search terms.
 * @return Aggregated rows for one report period.
 */
function aggregateSingleSearchTermReport(
	report: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	unknownLabel: string
): SearchTermRow[] {
	const byTerm = new Map< string, SearchTermRow >();
	const summaryEncryptedViews = getCount( report?.summary.encrypted_search_terms );
	let encryptedViews = summaryEncryptedViews ?? 0;
	let hasEncryptedViews = summaryEncryptedViews !== undefined;

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

		if ( summaryEncryptedViews === undefined ) {
			const bucketEncryptedViews = getEncryptedSearchTerms( point );
			if ( bucketEncryptedViews !== undefined ) {
				hasEncryptedViews = true;
				encryptedViews += bucketEncryptedViews;
			}
		}
	}

	const rows = [ ...byTerm.values() ];

	if ( encryptedViews > 0 && hasEncryptedViews ) {
		rows.push( { id: 'unknown-search-terms', term: unknownLabel, views: encryptedViews } );
	}

	return rows;
}

/**
 * Aggregate and match Search terms rows across the current and comparison periods.
 *
 * The encrypted aggregate is represented by the stable "Unknown search terms"
 * row and participates in comparison matching like a regular term.
 *
 * @param primaryReport    - The current search-terms report.
 * @param unknownLabel     - Translated label for encrypted search terms.
 * @param comparisonReport - A successfully settled comparison report, when enabled.
 * @return Comparison-aware rows and whether the comparison is available.
 */
export function aggregateSearchTermRows(
	primaryReport: StatsNormalizedReport< StatsSearchTermsItem > | undefined,
	unknownLabel: string,
	comparisonReport?: StatsNormalizedReport< StatsSearchTermsItem >
): { rows: SearchTermRow[]; hasComparison: boolean } {
	const primaryRows = aggregateSingleSearchTermReport( primaryReport, unknownLabel );

	if ( comparisonReport === undefined ) {
		return { rows: primaryRows, hasComparison: false };
	}

	const comparisonById = new Map(
		aggregateSingleSearchTermReport( comparisonReport, unknownLabel ).map( row => [
			row.id,
			row.views,
		] )
	);

	// The Stats payload reports truncation via `other_search_terms`: a positive
	// count means the comparison response does not list every term, so a term
	// missing from it may have simply fallen off the list rather than dropped
	// to zero. Only an untruncated comparison list can treat a missing term as
	// an explicit zero.
	const comparisonOtherSearchTerms = getCount( comparisonReport.summary.other_search_terms );
	const comparisonTruncated =
		comparisonOtherSearchTerms !== undefined && comparisonOtherSearchTerms > 0;

	return {
		rows: primaryRows.map( row => {
			const previousViews = comparisonById.get( row.id );

			if ( previousViews !== undefined ) {
				return { ...row, previousViews };
			}

			return { ...row, previousViews: comparisonTruncated ? undefined : 0 };
		} ),
		hasComparison: true,
	};
}
