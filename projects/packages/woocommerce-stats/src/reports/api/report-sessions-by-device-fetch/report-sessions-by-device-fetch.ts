/**
 * Internal dependencies
 */
import { fetchReport } from '../../fetch-report';
import type { BaseReportParams } from '../../utils/types';

type SessionsByDeviceItem = {
	/** Empty, or null, for sessions with no recorded device. */
	device_type: string | null;
	active_sessions: string | null;
};

type SessionsByDeviceSummary = {
	active_sessions: string | null;
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
