/**
 * Internal dependencies
 */
import { fetchReportSessionsByDevice } from '../../api/report-sessions-by-device-fetch';

type ReportsSessionsByDeviceResponse = Awaited< ReturnType< typeof fetchReportSessionsByDevice > >;

type SessionsByDeviceItem = ReportsSessionsByDeviceResponse[ 'data' ][ number ];

type SanitizedSessionsByDeviceItem = {
	device_type: string;
	active_sessions: number;
};

type SessionsByDeviceSummary = {
	total_sessions: number;
};

type SanitizedSessionsByDeviceResponse = {
	summary: SessionsByDeviceSummary;
	data: SanitizedSessionsByDeviceItem[];
};

function sanitizeSessionsByDeviceItem( item: SessionsByDeviceItem ): SanitizedSessionsByDeviceItem {
	return {
		device_type: item.device_type || '',
		active_sessions: parseInt( item.active_sessions, 10 ) || 0,
	};
}

export const sanitizeReportSessionsByDeviceResponse = (
	response: ReportsSessionsByDeviceResponse
): SanitizedSessionsByDeviceResponse => {
	const data = ( response?.data ?? [] ).map( sanitizeSessionsByDeviceItem );
	// The report's own count: the device rows can add up to more than it.
	const summarySessions = parseInt( response?.summary?.active_sessions ?? '', 10 );
	const totalSessions = Number.isNaN( summarySessions )
		? data.reduce( ( acc, item ) => acc + item.active_sessions, 0 )
		: summarySessions;

	return {
		summary: {
			total_sessions: totalSessions,
		},
		data,
	};
};
