/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { StatsCommentFollowersItem, StatsNormalizedReport } from '../processing/stats';

export type StatsCommentFollowersResponse = StatsNormalizedReport< StatsCommentFollowersItem >;
export type StatsCommentFollowersParams = {
	page?: number;
	max?: number;
};

export const statsCommentFollowersQuery = (
	params: StatsCommentFollowersParams = {}
): StatsReportQueryOptions< 'commentFollowers' > =>
	statsProxyQuery( {
		name: 'comment-followers',
		version: '1.1',
		endpoint: 'stats/comment-followers',
		params: {
			...( params.max !== undefined ? { max: params.max } : {} ),
			...( params.page !== undefined ? { page: params.page } : {} ),
		},
		sanitizer: 'commentFollowers',
	} );
