/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsTopAuthorsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-authors', 'stats/top-authors', params, 'topAuthors' );
