/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportConversionRate } from '../api/report-conversion-rate-fetch';
import { sanitizeReportConversionRateResponse } from '../processing/conversion-rate';
import type { RequestReportConversionRateParams } from '../api/report-conversion-rate-fetch';
import type { UseQueryOptions } from '@tanstack/react-query';

const getReportConversionRateQueryKey = ( p: RequestReportConversionRateParams ) =>
	[ 'reports', 'conversion-rate', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportConversionRateQuery(
	params: RequestReportConversionRateParams
): UseQueryOptions< ReturnType< typeof sanitizeReportConversionRateResponse > > {
	return {
		queryKey: getReportConversionRateQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportConversionRate( params );
			return sanitizeReportConversionRateResponse( response );
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
