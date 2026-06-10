/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportCouponsByDate } from '../api';
import { sanitizeReportCouponsByDateResponse } from '../processing/coupons-by-date';
import { FilterCondition } from '../types/filter-condition';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportCouponsByDateParams = Parameters< typeof fetchReportCouponsByDate >[ 0 ] & {
	filters?: FilterCondition[];
};

const getQueryKey = ( p: RequestReportCouponsByDateParams ) =>
	[ 'reports', 'couponsByDate', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportCouponsByDateQuery(
	params: RequestReportCouponsByDateParams
): UseQueryOptions< ReportDataMap[ 'couponsByDate' ] > {
	return {
		queryKey: getQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportCouponsByDate( params );
			return sanitizeReportCouponsByDateResponse( response );
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
