/**
 * Internal dependencies
 */
import { statsDevicesQuery } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsDevices,
	StatsDevicesDeviceParam,
	StatsDevicesParams,
} from '../queries/stats-devices-query';

export function useStatsDevices(
	params: StatsDevicesParams,
	options?: UseStatsOptions
): UseReportResult< StatsDevices > {
	return useStatsReport(
		statsDevicesQuery,
		params,
		[ 'stats', 'devices', '__comparison__', 'disabled' ],
		options
	);
}

export type { StatsDevices, StatsDevicesDeviceParam, StatsDevicesParams };
