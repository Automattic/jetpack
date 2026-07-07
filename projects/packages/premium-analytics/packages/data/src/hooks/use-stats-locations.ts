/**
 * Internal dependencies
 */
import { mergeStatsLocationsComparisonRows } from '../processing/stats';
import { statsLocationsQuery } from '../queries/stats-locations-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsLocationsComparisonItem,
	StatsLocationsItem,
	StatsNormalizedReport,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsLocationsOptions = UseStatsOptions & {
	maxRows?: number;
};

export function useStatsLocations(
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' },
	options?: StatsLocationsOptions
) {
	const { maxRows, ...queryOptions } = options ?? {};

	return useStatsReport<
		StatsReportParams & { geoMode?: 'country' | 'region' | 'city' },
		StatsNormalizedReport< StatsLocationsItem >,
		StatsLocationsComparisonItem
	>( statsLocationsQuery, params, 'locations', {
		...queryOptions,
		mergeComparisonRows: ( primary, comparison ) =>
			mergeStatsLocationsComparisonRows( primary, comparison, maxRows ),
	} );
}
