/**
 * Internal dependencies
 */
import { mergeStatsLocationsComparisonRows } from '../processing/stats';
import { statsLocationsQuery } from '../queries/stats-locations-query';
import { createStatsListReportHook, splitStatsListOptions } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsLocationsComparisonItem,
	StatsLocationsItem,
	StatsNormalizedReport,
} from '../processing/stats';

type StatsLocationsOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsLocations = createStatsListReportHook<
	Parameters< typeof statsLocationsQuery >[ 0 ],
	StatsNormalizedReport< StatsLocationsItem >,
	StatsLocationsComparisonItem,
	StatsLocationsOptions
>( {
	queryFactory: statsLocationsQuery,
	reportSlug: 'locations',
	mergeComparisonRows: mergeStatsLocationsComparisonRows,
	getOptions: splitStatsListOptions,
} );
