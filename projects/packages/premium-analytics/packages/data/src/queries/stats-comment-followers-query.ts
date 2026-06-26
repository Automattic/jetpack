/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportQueryParams } from './stats-query';

export type StatsCommentFollowersParams = StatsReportQueryParams & {
	page?: number;
	max?: number;
};

export const statsCommentFollowersQuery = ( params: StatsCommentFollowersParams ) =>
	statsReportQuery(
		'comment-followers',
		'stats/comment-followers',
		params,
		'commentFollowers',
		'1.1',
		params.page === undefined ? undefined : { page: params.page },
		{ enabled: true, includeDefaultPeriod: false }
	);
