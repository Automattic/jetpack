/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

// The only three properties `stats/devices/{property}` accepts; anything else
// is rejected with a 400 before the query runs.
export type StatsDeviceProperty = 'screensize' | 'browser' | 'platform';

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
