/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsEmailOpensBreakdown = 'client' | 'device' | 'country' | 'rate';
export type StatsEmailClicksBreakdown = StatsEmailOpensBreakdown | 'link' | 'user-content-link';

export const statsEmailOpensBreakdownQuery = (
	postId: number,
	breakdown: StatsEmailOpensBreakdown,
	params: StatsQueryParams = {}
) =>
	statsProxyQuery( {
		name: `email-opens-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }/${ breakdown }`,
		params,
		sanitizer: 'emailBreakdown',
	} );

export const statsEmailClicksBreakdownQuery = (
	postId: number,
	breakdown: StatsEmailClicksBreakdown,
	params: StatsQueryParams = {}
) =>
	statsProxyQuery( {
		name: `email-clicks-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }/${ breakdown }`,
		params,
		sanitizer: 'emailBreakdown',
	} );
