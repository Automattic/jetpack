/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsPostResponse } from '../processing/stats';

export type StatsPostField =
	| 'date'
	| 'views'
	| 'like_count'
	| 'years'
	| 'averages'
	| 'weeks'
	| 'highest_month'
	| 'highest_day_average'
	| 'highest_week_average'
	| 'post';

export type StatsPostParams = {
	postId: number;
	fields?: StatsPostField[];
};

export type { StatsPostResponse };

export const statsPostQuery = ( params: StatsPostParams ): StatsReportQueryOptions< 'post' > => {
	const postParams: StatsProxyParams = {
		fields: params.fields?.join( ',' ) ?? '',
	};

	return statsProxyQuery( {
		name: 'post',
		version: '1.1',
		endpoint: `stats/post/${ params.postId }`,
		params: postParams,
		sanitizer: 'post',
		enabled: Number.isInteger( params.postId ) && params.postId > 0,
	} );
};
