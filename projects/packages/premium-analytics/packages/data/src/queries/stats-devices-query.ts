/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsDevicesQuery = ( params: StatsReportParams & { deviceProperty?: string } ) =>
	statsReportQuery(
		'devices',
		`stats/devices/${ params.deviceProperty ?? 'screensize' }`,
		params,
		'devices'
	);
