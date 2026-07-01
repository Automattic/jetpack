/**
 * Internal dependencies
 */
import { fetchReportSessionsByDevice } from '../../api/report-sessions-by-device-fetch';

/**
 * Inferred types from fetch response
 */
type ReportsSessionsByDeviceResponse = Awaited< ReturnType< typeof fetchReportSessionsByDevice > >;

/**
 * Raw item type from API response
 */
type SessionsByDeviceItem = ReportsSessionsByDeviceResponse[ 'data' ][ number ];

/**
 * Sanitized item with numeric values
 */
type SanitizedSessionsByDeviceItem = {
	device_type: string;
	active_sessions: number;
};

/**
 * Summary with total sessions
 */
type SessionsByDeviceSummary = {
	total_sessions: number;
};

/**
 * Processed response structure
 */
type SanitizedSessionsByDeviceResponse = {
	summary: SessionsByDeviceSummary;
	data: SanitizedSessionsByDeviceItem[];
};

/**
 * Sanitize a single sessions by device item by converting strings to numbers.
 *
 * @param item - Raw item from API response
 */
function sanitizeSessionsByDeviceItem( item: SessionsByDeviceItem ): SanitizedSessionsByDeviceItem {
	return {
		device_type: item.device_type || '',
		active_sessions: parseInt( item.active_sessions, 10 ) || 0,
	};
}

/**
 * Sanitize the response from the sessions/by-device endpoint.
 *
 * Converts string values to numbers for easier calculations and charting.
 * Also calculates total sessions summary.
 *
 * @param response - Raw API response with summary and items
 */
export const sanitizeReportSessionsByDeviceResponse = (
	response: ReportsSessionsByDeviceResponse
): SanitizedSessionsByDeviceResponse => {
	const items = response?.data ?? [];
	const data = items
		.filter( item => item.device_type ) // Filter out empty device types
		.map( sanitizeSessionsByDeviceItem );

	const totalSessions = data.reduce( ( acc, item ) => acc + item.active_sessions, 0 );

	return {
		summary: {
			total_sessions: totalSessions,
		},
		data,
	};
};
