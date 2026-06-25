/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, statsQueryParamsToApiParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsUtmItem, StatsUtmParam, StatsNormalizedReport } from '../processing/stats';

const DEFAULT_UTM_PARAM: StatsUtmParam = 'utm_source,utm_medium';

export type StatsUtmParams = StatsReportParams & {
	utmParam?: StatsUtmParam;
	post_id?: number;
	query_top_posts?: boolean;
};

export type StatsUtmResponse = StatsNormalizedReport< StatsUtmItem >;

export const statsUtmQuery = ( params: StatsUtmParams ): StatsReportQueryOptions< 'utm' > => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	const utmParam = params.utmParam ?? DEFAULT_UTM_PARAM;
	const postId = params.post_id || '';
	const queryTopPosts = postId ? false : params.query_top_posts ?? true;
	const utmParams: StatsProxyParams = {
		max: apiParams.max ?? 10,
		date: apiParams.date,
		days: apiParams.days,
		// Match Calypso's UTM request shape; the endpoint accepts empty values for
		// missing optional filters.
		start_date: apiParams.start_date ?? '',
		post_id: postId,
		// Calypso sends booleans for this endpoint; keep parity with that request shape.
		query_top_posts: queryTopPosts,
	};

	return statsProxyQuery( {
		name: 'utm',
		version: '1.1',
		endpoint: `stats/utm/${ utmParam }`,
		params: utmParams,
		sanitizer: 'utm',
		sanitizerParams: { utm_param: utmParam },
		enabled: !! apiParams.date,
	} );
};
