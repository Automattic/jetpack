/**
 * Internal dependencies
 */
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsNormalizedReport, StatsPublicizeItem } from '../processing/stats';

export type StatsPublicizeParams = Partial< StatsReportParams >;
export type StatsPublicizeResponse = StatsNormalizedReport< StatsPublicizeItem >;

export const statsPublicizeQuery = (): StatsReportQueryOptions< 'publicize' > =>
	statsProxyQuery( {
		name: 'publicize',
		version: '1.1',
		endpoint: 'stats/publicize',
		sanitizer: 'publicize',
	} );
