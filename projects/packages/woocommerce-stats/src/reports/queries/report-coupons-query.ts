/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { FilterCondition } from '@jetpack-premium-analytics/data/src/types/filter-condition';
import { fetchReportCoupons } from '../api/report-coupons-fetch';
import { sanitizeReportCouponsResponse } from '../processing/coupons';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportCouponsParams = Parameters< typeof fetchReportCoupons >[ 0 ] & {
	filters?: FilterCondition[];
};

const getReportCouponsQueryKey = ( p: RequestReportCouponsParams ) =>
	[ 'reports', 'coupons', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportCouponsQuery(
	params: RequestReportCouponsParams
): UseQueryOptions< ReturnType< typeof sanitizeReportCouponsResponse > > {
	return {
		queryKey: getReportCouponsQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportCoupons( params );
			return sanitizeReportCouponsResponse( response );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
