/**
 * Internal dependencies
 */
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsFollowersItem, StatsNormalizedReport } from '../processing/stats';

export type StatsFollowersResponse = StatsNormalizedReport< StatsFollowersItem >;
export type StatsFollowersParams = Partial< StatsReportParams > & {
	type?: 'all' | 'email' | 'wpcom';
	filter_admin?: boolean;
	max?: number;
};

export const statsFollowersQuery = (
	params: StatsFollowersParams = {}
): StatsReportQueryOptions< 'followers' > =>
	statsProxyQuery( {
		name: 'followers',
		version: '1.1',
		endpoint: 'stats/followers',
		params: {
			type: params.type ?? 'all',
			filter_admin: params.filter_admin ?? false,
			max: params.max ?? 10,
		},
		sanitizer: 'followers',
	} );
