/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsCommentFollowersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'comment-followers', 'stats/comment-followers', params, 'commentFollowers' );
