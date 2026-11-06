/**
 * Internal dependencies
 */
import { fetchReportSessionsByDevice } from '../../api/report-sessions-by-device-fetch';
import { safeParseInt } from '../../utils/parsing';

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
		active_sessions: safeParseInt( item.active_sessions ),
	};
}

export const sanitizeReportSessionsByDeviceResponse = (
	response: ReportsSessionsByDeviceResponse
): SanitizedSessionsByDeviceResponse => {
	const data = ( response?.data ?? [] ).map( sanitizeSessionsByDeviceItem );
	// The report's own count: the device rows can add up to more than it.
	const totalSessions = safeParseInt(
		response?.summary?.active_sessions,
		data.reduce( ( acc, item ) => acc + item.active_sessions, 0 )
	);

	return {
		summary: {
			total_sessions: totalSessions,
		},
		data,
	};
};
