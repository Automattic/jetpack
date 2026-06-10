/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportCoupons } from '../api';
import { sanitizeReportCouponsResponse } from '../processing/coupons';
import { FilterCondition } from '../types/filter-condition';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportCouponsParams = Parameters< typeof fetchReportCoupons >[ 0 ] & {
	filters?: FilterCondition[];
};

const getReportCouponsQueryKey = ( p: RequestReportCouponsParams ) =>
	[ 'reports', 'coupons', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportCouponsQuery(
	params: RequestReportCouponsParams
): UseQueryOptions< ReportDataMap[ 'coupons' ] > {
	return {
		queryKey: getReportCouponsQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportCoupons( params );
			return sanitizeReportCouponsResponse( response );
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
