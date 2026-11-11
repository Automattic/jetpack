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

export type StatsDeviceProperty = 'screensize' | 'browser' | 'platform' | 'client_type';

export type StatsDevicesParams = StatsReportParams & { deviceProperty?: StatsDeviceProperty };

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
	params: StatsDevicesParams
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
