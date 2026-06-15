/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
import type { BaseReportParams } from '../../utils/types';

/**
 * Raw response item from the sessions/by-device endpoint.
 */
type SessionsByDeviceItem = {
	device_type: string;
	active_sessions: string;
};

/**
 * Summary data from the sessions/by-device endpoint.
 */
type SessionsByDeviceSummary = {
	active_sessions: string;
	total_orders: string;
	date_start: string;
	date_end: string;
};

/**
 * Raw response structure from the sessions/by-device endpoint.
 */
type ReportsSessionsByDeviceResponse = {
	summary: SessionsByDeviceSummary;
	data: SessionsByDeviceItem[];
};

export type RequestReportSessionsByDeviceParams = Omit< BaseReportParams, 'interval' >;

/**
 * Fetch sessions by device type report data.
 *
 * This endpoint returns a breakdown of sessions by device category
 * (Mobile, Desktop, Tablet) for the specified date range.
 *
 * @param params      - Request parameters
 * @param params.from - Start date in YYYY-MM-DD format
 * @param params.to   - End date in YYYY-MM-DD format
 */
export async function fetchReportSessionsByDevice( {
	from,
	to,
}: RequestReportSessionsByDeviceParams ): Promise< ReportsSessionsByDeviceResponse > {
	const path = addQueryArgs( `${ reportsPath }/sessions/by-device`, {
		from,
		to,
	} );

	return apiFetch( { path } ) as Promise< ReportsSessionsByDeviceResponse >;
}
