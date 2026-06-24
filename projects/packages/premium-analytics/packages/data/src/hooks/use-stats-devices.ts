/**
 * Internal dependencies
 */
import { statsDevicesQuery, type StatsDeviceProperty } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsDevices(
	params: StatsReportParams & { deviceProperty?: StatsDeviceProperty },
	options?: UseStatsOptions
) {
	return useStatsReport( statsDevicesQuery, params, 'devices', options );
}
