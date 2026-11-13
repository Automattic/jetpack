/**
 * Internal dependencies
 */
import { mergeStatsDevicesComparisonRows } from '../processing/stats';
import {
	statsDevicesPeriodsQuery,
	statsDevicesQuery,
	type StatsDeviceProperty,
	type StatsDevicesParams as StatsDevicesQueryParams,
} from '../queries/stats-devices-query';
import {
	createStatsListReportHook,
	splitStatsListOptions,
	useStatsReport,
} from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsDevicesComparisonItem,
	StatsDevicesItem,
	StatsNormalizedReport,
	StatsTimeSeriesReport,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

type StatsDevicesParams = ReportParams & { deviceProperty?: StatsDeviceProperty };

type StatsDevicesOptions = UseStatsOptions & {
	maxRows?: number;
};

const useStatsDevicesReport = createStatsListReportHook<
	StatsReportParams & { deviceProperty?: StatsDeviceProperty },
	StatsNormalizedReport< StatsDevicesItem >,
	StatsDevicesComparisonItem,
	StatsDevicesOptions
>( {
	queryFactory: statsDevicesQuery,
	reportSlug: 'devices',
	mergeComparisonRows: mergeStatsDevicesComparisonRows,
	getOptions: splitStatsListOptions,
} );

export function useStatsDevices( params: StatsDevicesParams, options?: StatsDevicesOptions ) {
	return useStatsDevicesReport(
		params as StatsReportParams & { deviceProperty?: StatsDeviceProperty },
		options
	);
}

/**
 * Views per device value in each `period` bucket of the range, and of the comparison range when it is on.
 *
 * @param params  - The report params, with the bucket size as `period`.
 * @param options - Query options.
 * @return The primary and comparison reports.
 */
export function useStatsDevicesPeriods(
	params: ReportParams & Pick< StatsDevicesQueryParams, 'deviceProperty' | 'period' >,
	options?: UseStatsOptions
) {
	return useStatsReport< StatsDevicesQueryParams, StatsTimeSeriesReport >(
		statsDevicesPeriodsQuery,
		params as StatsDevicesQueryParams,
		[ 'stats', 'devices-periods', '__comparison__', 'disabled' ],
		options
	);
}
