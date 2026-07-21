/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsSearchTermsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'search-terms', 'stats/search-terms', params, 'searchTerms' );
