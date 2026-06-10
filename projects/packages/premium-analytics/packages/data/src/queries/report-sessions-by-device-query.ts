/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportSessionsByDevice } from '../api/report-sessions-by-device-fetch';
import { sanitizeReportSessionsByDeviceResponse } from '../processing/sessions-by-device';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportSessionsByDeviceParams = Parameters< typeof fetchReportSessionsByDevice >[ 0 ];

const getReportSessionsByDeviceQueryKey = ( p: RequestReportSessionsByDeviceParams ) =>
	[ 'reports', 'sessions', 'by-device', p.from, p.to ] as const;

/**
 * Creates query options for fetching sessions by device report data.
 *
 * @param params - Request parameters with from/to dates
 */
export function reportSessionsByDeviceQuery(
	params: RequestReportSessionsByDeviceParams
): UseQueryOptions< ReportDataMap[ 'sessionsByDevice' ] > {
	return {
		queryKey: getReportSessionsByDeviceQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportSessionsByDevice( params );
			return sanitizeReportSessionsByDeviceResponse( response );
		},

		/**
		 * Enable the query only if from and to dates are set.
		 * Note: This endpoint doesn't use interval (it's not a time-series).
		 */
		enabled: !! ( params.from && params.to ),

		/**
		 * Keep previous data while fetching new data to prevent blank states
		 */
		placeholderData: previousData => previousData,
	};
}
