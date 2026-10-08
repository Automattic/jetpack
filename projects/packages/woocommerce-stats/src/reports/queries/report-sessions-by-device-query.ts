/**
 * Internal dependencies
 */
import { fetchReportSessionsByDevice } from '../api/report-sessions-by-device-fetch';
import { sanitizeReportSessionsByDeviceResponse } from '../processing/sessions-by-device';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

type RequestReportSessionsByDeviceParams = Parameters< typeof fetchReportSessionsByDevice >[ 0 ];

const getReportSessionsByDeviceQueryKey = ( p: RequestReportSessionsByDeviceParams ) =>
	[ 'reports', 'sessions', 'by-device', p.from, p.to ] as const;

export function reportSessionsByDeviceQuery(
	params: RequestReportSessionsByDeviceParams
): ReportQuery< ReturnType< typeof sanitizeReportSessionsByDeviceResponse > > {
	return {
		queryKey: getReportSessionsByDeviceQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportSessionsByDevice( params );
			return sanitizeReportSessionsByDeviceResponse( response );
		},

		// Not a time-series endpoint, so no interval is required.
		enabled: !! ( params.from && params.to ),

		placeholderData: previousData => previousData,
	};
}
