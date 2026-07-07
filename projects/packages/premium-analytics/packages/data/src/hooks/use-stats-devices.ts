/**
 * Internal dependencies
 */
import { mergeStatsDevicesComparisonRows } from '../processing/stats';
import { statsDevicesQuery, type StatsDeviceProperty } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsDevices( params: StatsDevicesParams, options?: StatsDevicesOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};

	return useStatsReport<
		StatsReportParams & { deviceProperty?: StatsDeviceProperty },
		StatsNormalizedReport< StatsDevicesItem >,
		StatsDevicesComparisonItem
	>(
		statsDevicesQuery,
		params as StatsReportParams & { deviceProperty?: StatsDeviceProperty },
		'devices',
		{
			...queryOptions,
			mergeComparisonRows: ( primary, comparison ) =>
				mergeStatsDevicesComparisonRows( primary, comparison, maxRows ),
		}
	);
}
