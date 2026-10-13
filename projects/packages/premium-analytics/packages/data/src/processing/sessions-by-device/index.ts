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
	const items = response?.data ?? [];
	const data = items.filter( item => item.device_type ).map( sanitizeSessionsByDeviceItem );

	const totalSessions = data.reduce( ( acc, item ) => acc + item.active_sessions, 0 );

	return {
		summary: {
			total_sessions: totalSessions,
		},
		data,
	};
};
