/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsDevicesItem, StatsNormalizedReport } from '../processing/stats';

export type StatsDevicesDeviceParam = 'screensize' | 'browser' | 'platform';

export type StatsDevicesParams = StatsReportParams & {
	deviceParam?: StatsDevicesDeviceParam;
};

export type StatsDevices = StatsNormalizedReport< StatsDevicesItem >;

export const statsDevicesQuery = (
	params: StatsDevicesParams
): StatsReportQueryOptions< 'devices' > =>
	statsReportQuery(
		'devices',
		`stats/devices/${ params.deviceParam ?? 'screensize' }`,
		params,
		'devices'
	);
