/**
 * Internal dependencies
 */
import { mergeStatsDevicesComparisonRows } from '../processing/stats';
import { statsDevicesQuery, type StatsDeviceProperty } from '../queries/stats-devices-query';
import { createStatsListReportHook } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsDevicesComparisonItem,
	StatsDevicesItem,
	StatsNormalizedReport,
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
} );

export function useStatsDevices( params: StatsDevicesParams, options?: StatsDevicesOptions ) {
	return useStatsDevicesReport(
		params as StatsReportParams & { deviceProperty?: StatsDeviceProperty },
		options
	);
}
