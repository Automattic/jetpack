/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsEmailBreakdownItem, StatsNormalizedReport } from '../processing/stats';

export type StatsEmailOpensBreakdown = 'client' | 'device' | 'country' | 'rate';
export type StatsEmailClicksBreakdown = StatsEmailOpensBreakdown | 'link' | 'user-content-link';
export type StatsEmailBreakdown = StatsNormalizedReport< StatsEmailBreakdownItem >;

const hasValidPostId = ( postId: number ) => Number.isInteger( postId ) && postId > 0;

// The all-time breakdown endpoints are keyed entirely by post ID and breakdown; unlike the
// timeline endpoint they take no period/date query params (see Calypso PERIOD_ALL_TIME handling).
export const statsEmailOpensBreakdownQuery = (
	postId: number,
	breakdown: StatsEmailOpensBreakdown
): StatsReportQueryOptions< 'emailBreakdown' > =>
	statsProxyQuery( {
		name: `email-opens-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }/${ breakdown }`,
		sanitizer: 'emailBreakdown',
		enabled: hasValidPostId( postId ),
	} );

export const statsEmailClicksBreakdownQuery = (
	postId: number,
	breakdown: StatsEmailClicksBreakdown
): StatsReportQueryOptions< 'emailBreakdown' > =>
	statsProxyQuery( {
		name: `email-clicks-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }/${ breakdown }`,
		sanitizer: 'emailBreakdown',
		enabled: hasValidPostId( postId ),
	} );
