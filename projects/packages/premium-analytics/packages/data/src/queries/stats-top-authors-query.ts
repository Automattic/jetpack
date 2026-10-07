/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsTopAuthorsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-authors', 'stats/top-authors', params, 'topAuthors', '1.1', undefined, {
		// A start date would override the window WPCOM derives from a negative `num`.
		omitParams: params.num !== undefined && params.num < 0 ? [ 'days', 'start_date' ] : [ 'days' ],
	} );
