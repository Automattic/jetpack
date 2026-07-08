/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportVisitorsByLocation } from '../api';
import { sanitizeReportVisitorsByLocationResponse } from '../processing/visitors-by-location';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportVisitorsByLocationParams = Parameters<
	typeof fetchReportVisitorsByLocation
>[ 0 ];

const getReportVisitorsByLocationQueryKey = ( p: RequestReportVisitorsByLocationParams ) =>
	[
		'reports',
		'visitors',
		'by-location',
		p.group_by,
		p.country_code ?? null,
		p.from,
		p.to,
		p.interval,
		p.limit ?? null,
	] as const;

export function reportVisitorsByLocationQuery(
	params: RequestReportVisitorsByLocationParams
): UseQueryOptions< ReportDataMap[ 'visitorsByLocation' ] > {
	return {
		queryKey: getReportVisitorsByLocationQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportVisitorsByLocation( params );
			return sanitizeReportVisitorsByLocationResponse( response );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
