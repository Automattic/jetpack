/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export const statsSearchTermsQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'searchTerms' > =>
	statsReportQuery( 'search-terms', 'stats/search-terms', params, 'searchTerms', '1.1', undefined, {
		// The Search Terms endpoint derives the inclusive range from start_date
		// and date, matching legacy Stats, rather than the generic report-layer
		// `days` parameter.
		omitParams: [ 'days' ],
	} );
