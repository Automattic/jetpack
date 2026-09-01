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
		omitParams: [ 'days' ],
	} );
