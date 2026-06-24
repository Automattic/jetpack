/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsFollowersItem, StatsNormalizedReport } from '../processing/stats';

export type StatsFollowersResponse = StatsNormalizedReport< StatsFollowersItem >;

export const statsFollowersQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'followers' > =>
	statsReportQuery( 'followers', 'stats/followers', params, 'followers' );
