/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, statsQueryParamsToApiParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsPeriod } from '../utils/stats-params';

export type StatsDeviceProperty = 'screensize' | 'browser' | 'platform' | 'client_type';

/** The buckets the endpoint's `unit` mode accepts; it has no hourly data. */
export const STATS_DEVICES_PERIODS = [
	'day',
	'week',
	'month',
	'quarter',
	'year',
] as const satisfies readonly StatsPeriod[];

export type StatsDevicesPeriod = ( typeof STATS_DEVICES_PERIODS )[ number ];

export type StatsDevicesParams = StatsReportParams & { deviceProperty?: StatsDeviceProperty };

export type StatsDevicesPeriodsParams = StatsDevicesParams & { period: StatsDevicesPeriod };

export const statsDevicesQuery = ( params: StatsDevicesParams ) => {
	const deviceProperty = params.deviceProperty ?? 'screensize';

	return statsReportQuery(
		`devices-${ deviceProperty }`,
		`stats/devices/${ deviceProperty }`,
		params,
		'devices'
	);
};

/**
 * Views per device value in each `period` bucket of the range, from the endpoint's `unit` mode.
 *
 * @param params - The report range, its `period`, and the device property.
 * @return The query options.
 */
export const statsDevicesPeriodsQuery = (
	params: StatsDevicesPeriodsParams
): StatsReportQueryOptions< 'devicesPeriods' > => {
	const deviceProperty = params.deviceProperty ?? 'screensize';
	const apiParams = statsQueryParamsToApiParams( reportParamsToStatsQueryParams( params ) );
	// `start_date` + `date` bound the window, as for `stats/visits`; `summarize` would collapse the buckets.
	const periodsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: apiParams.date,
		start_date: apiParams.start_date,
	};

	return statsProxyQuery( {
		name: `devices-${ deviceProperty }-periods`,
		version: '1.1',
		endpoint: `stats/devices/${ deviceProperty }`,
		params: periodsParams,
		sanitizer: 'devicesPeriods',
		enabled: !! ( periodsParams.date || periodsParams.start_date ),
	} );
};
