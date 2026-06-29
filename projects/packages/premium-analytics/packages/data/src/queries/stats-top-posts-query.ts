/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsTopPostsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-posts', 'stats/top-posts', params, 'topPosts' );
