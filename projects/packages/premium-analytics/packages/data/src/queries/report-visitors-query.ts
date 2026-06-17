/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportVisitors } from '../api';
import { sanitizeReportVisitorsResponse } from '../processing/visitors';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportVisitorsParams = Parameters< typeof fetchReportVisitors >[ 0 ];

const getReportVisitorsQueryKey = ( p: RequestReportVisitorsParams ) =>
	[ 'reports', 'visitors', 'by-date', p.from, p.to, p.interval, p.date_type ] as const;

export function reportVisitorsQuery(
	params: RequestReportVisitorsParams
): UseQueryOptions< ReportDataMap[ 'visitors' ] > {
	return {
		queryKey: getReportVisitorsQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportVisitors( params );
			return sanitizeReportVisitorsResponse( response );
		},

		/**
		 * Enable the query only if the from, to, and interval are set.
		 */
		enabled: !! ( params.from && params.to && params.interval ),

		/**
		 * Keep previous data while fetching new data to prevent blank states
		 */
		placeholderData: previousData => previousData,
	};
}
