/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsCommentsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'comments', 'stats/comments', params, 'comments' );
