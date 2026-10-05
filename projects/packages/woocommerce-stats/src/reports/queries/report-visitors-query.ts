/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { resolveReportTimeZone } from '@jetpack-premium-analytics/data/src/utils/report-timezone';
import { fetchReportVisitors } from '../api/report-visitors-fetch';
import { sanitizeReportVisitorsResponse } from '../processing/visitors';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportVisitorsParams = Parameters< typeof fetchReportVisitors >[ 0 ];

const getReportVisitorsQueryKey = ( p: RequestReportVisitorsParams ) =>
	[ 'reports', 'visitors', 'by-date', p.from, p.to, p.interval, p.date_type ] as const;

export function reportVisitorsQuery(
	params: RequestReportVisitorsParams
): UseQueryOptions< ReturnType< typeof sanitizeReportVisitorsResponse > > {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [ ...getReportVisitorsQueryKey( params ), timezone ],
		queryFn: async () => {
			const response = await fetchReportVisitors( params );
			return sanitizeReportVisitorsResponse( response, timezone );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
