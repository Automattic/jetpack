/**
 * Internal dependencies
 */
import { sanitizeStatsTimeSeriesResponse } from './time-series';
import type { StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export function sanitizeStatsVisitsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	return sanitizeStatsTimeSeriesResponse( response, query );
}
