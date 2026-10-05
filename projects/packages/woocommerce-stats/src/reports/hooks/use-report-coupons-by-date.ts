/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportCouponsByDateQuery } from '../queries/report-coupons-by-date-query';

export function useReportCouponsByDate( params: ReportParams ) {
	return useReport( p => reportCouponsByDateQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'couponsByDate', '__comparison__', 'disabled' ],
	} );
}
