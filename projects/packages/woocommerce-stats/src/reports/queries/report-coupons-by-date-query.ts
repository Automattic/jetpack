/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportCouponsByDate } from '../api/report-coupons-by-date-fetch';
import { sanitizeReportCouponsByDateResponse } from '../processing/coupons-by-date';
import { FilterCondition } from '../types/filter-condition';
import { resolveReportTimeZone } from '../utils/report-timezone';
import type { ReportQuery } from '../utils/types';

type RequestReportCouponsByDateParams = Parameters< typeof fetchReportCouponsByDate >[ 0 ] & {
	filters?: FilterCondition[];
};

const getQueryKey = ( p: RequestReportCouponsByDateParams ) =>
	[ 'reports', 'couponsByDate', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportCouponsByDateQuery(
	params: RequestReportCouponsByDateParams
): ReportQuery< ReturnType< typeof sanitizeReportCouponsByDateResponse > > {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [ ...getQueryKey( params ), timezone ],
		queryFn: async () => {
			const response = await fetchReportCouponsByDate( params );
			return sanitizeReportCouponsByDateResponse( response, timezone );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
