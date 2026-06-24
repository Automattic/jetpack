/**
 * Internal dependencies
 */
import { statsDevicesQuery } from '../queries/stats-devices-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsDevices,
	StatsDevicesParams,
	StatsDevicesProperty,
} from '../queries/stats-devices-query';

export function useStatsDevices( params: StatsDevicesParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsDevicesQuery,
		params,
		[ 'stats', 'devices', '__comparison__', 'disabled' ],
		options
	);
}

export type { StatsDevices, StatsDevicesParams, StatsDevicesProperty };
