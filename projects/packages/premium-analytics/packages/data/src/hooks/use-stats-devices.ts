/**
 * Internal dependencies
 */
import { statsDevicesQuery } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsDevicesParams = StatsReportParams & {
	deviceProperty?: string;
};

export function useStatsDevices( params: StatsDevicesParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsDevicesQuery,
		params,
		[ 'stats', 'devices', '__comparison__', 'disabled' ],
		options
	);
}
