/**
 * Internal dependencies
 */
import { sanitizeStatsTimeSeriesResponse } from './time-series';
import type { StatsTimeSeriesReport } from './time-series';
import type { StatsQueryParams } from '../../utils/stats-params';

export function sanitizeStatsVisitsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsTimeSeriesReport {
	return sanitizeStatsTimeSeriesResponse( response, query );
}
