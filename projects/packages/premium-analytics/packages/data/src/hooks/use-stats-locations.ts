/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsLocationsQuery } from '../queries/stats-locations-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsLocations(
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' },
	options?: UseStatsOptions
) {
	return useStatsReport(
		statsLocationsQuery,
		params,
		[ 'stats', 'locations', '__comparison__', 'disabled' ],
		options
	);
}
