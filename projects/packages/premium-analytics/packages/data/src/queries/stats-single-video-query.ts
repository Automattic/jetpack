/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type StatsSingleVideoParams = Partial< StatsReportParams >;

export const statsSingleVideoQuery = (
	videoId: number,
	params: StatsSingleVideoParams = {}
): StatsReportQueryOptions< 'singleVideo' > =>
	statsProxyQuery( {
		name: 'single-video',
		version: '1.1',
		endpoint: `stats/video/${ videoId }`,
		params: reportParamsToStatsQueryParams( params ),
		sanitizer: 'singleVideo',
		enabled: Number.isInteger( videoId ) && videoId > 0,
	} );
