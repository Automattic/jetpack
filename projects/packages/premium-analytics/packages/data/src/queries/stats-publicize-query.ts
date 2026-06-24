/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsNormalizedReport, StatsPublicizeItem } from '../processing/stats';

export type StatsPublicizeResponse = StatsNormalizedReport< StatsPublicizeItem >;

export const statsPublicizeQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'publicize' > =>
	statsReportQuery( 'publicize', 'stats/publicize', params, 'publicize' );
