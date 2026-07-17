/**
 * External dependencies
 */
import { useCallback } from 'react';
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
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsDevicesItem >,
			comparison?: StatsNormalizedReport< StatsDevicesItem >
		) => mergeStatsDevicesComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

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
			mergeComparisonRows,
		}
	);
}
