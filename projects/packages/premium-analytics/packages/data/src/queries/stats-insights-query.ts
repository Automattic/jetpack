/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsInsightsYear = {
	year: string;
	total_posts: number;
	total_comments: number;
	avg_comments: number;
	total_likes: number;
	avg_likes: number;
	total_words: number;
	avg_words: number;
};

export type StatsInsightsResponse = {
	highest_hour: number;
	highest_day_percent: number;
	highest_day_of_week: number;
	highest_hour_percent: number;
	hourly_views: unknown[];
	years: StatsInsightsYear[];
};

export const statsInsightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'insights',
		version: '1.1',
		endpoint: 'stats/insights',
		params,
	} );
