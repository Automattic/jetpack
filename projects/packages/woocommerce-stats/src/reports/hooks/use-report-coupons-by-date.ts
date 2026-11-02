/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportCouponsByDateQuery } from '../queries/report-coupons-by-date-query';
import { type ReportParams } from '../utils/types';

export function useReportCouponsByDate( params: ReportParams ) {
	return useReport( p => reportCouponsByDateQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'couponsByDate', '__comparison__', 'disabled' ],
	} );
}
