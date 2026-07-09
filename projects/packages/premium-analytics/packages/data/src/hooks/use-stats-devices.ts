/**
 * Internal dependencies
 */
import { statsDevicesQuery, type StatsDeviceProperty } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

type StatsDevicesParams = ReportParams & { deviceProperty?: StatsDeviceProperty };

export function useStatsDevices( params: StatsDevicesParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsDevicesQuery,
		params as StatsReportParams & { deviceProperty?: StatsDeviceProperty },
		'devices',
		options
	);
}
