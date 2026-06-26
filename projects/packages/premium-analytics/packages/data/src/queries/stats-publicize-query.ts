/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { StatsNormalizedReport, StatsPublicizeItem } from '../processing/stats';

export type StatsPublicizeParams = Record< string, never >;
export type StatsPublicizeResponse = StatsNormalizedReport< StatsPublicizeItem >;

export const statsPublicizeQuery = (
	params: StatsPublicizeParams = {}
): StatsReportQueryOptions< 'publicize' > =>
	statsProxyQuery( {
		name: 'publicize',
		version: '1.1',
		endpoint: 'stats/publicize',
		params,
		sanitizer: 'publicize',
	} );
