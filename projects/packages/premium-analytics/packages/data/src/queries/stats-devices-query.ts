/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export type StatsDeviceProperty = 'screensize' | 'browser' | 'platform' | 'client_type';

export const statsDevicesQuery = (
	params: StatsReportParams & { deviceProperty?: StatsDeviceProperty }
) => {
	const deviceProperty = params.deviceProperty ?? 'screensize';

	return statsReportQuery(
		`devices-${ deviceProperty }`,
		`stats/devices/${ deviceProperty }`,
		params,
		'devices'
	);
};
