/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsFollowersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'followers', 'stats/followers', params, 'followers' );
