/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { BaseReportParams } from '../../utils/types';

type SessionsByDeviceItem = {
	device_type: string;
	active_sessions: string;
};

type SessionsByDeviceSummary = {
	active_sessions: string;
	total_orders: string;
	date_start: string;
	date_end: string;
};

type ReportsSessionsByDeviceResponse = {
	summary: SessionsByDeviceSummary;
	data: SessionsByDeviceItem[];
};

export type RequestReportSessionsByDeviceParams = Omit< BaseReportParams, 'interval' >;

/** Breaks sessions down by device category (Mobile, Desktop, Tablet). */
export async function fetchReportSessionsByDevice( {
	from,
	to,
}: RequestReportSessionsByDeviceParams ): Promise< ReportsSessionsByDeviceResponse > {
	return fetchReport< ReportsSessionsByDeviceResponse >( 'sessions/by-device', {
		from,
		to,
	} );
}
