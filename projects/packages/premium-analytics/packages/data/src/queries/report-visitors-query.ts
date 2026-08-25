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

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
