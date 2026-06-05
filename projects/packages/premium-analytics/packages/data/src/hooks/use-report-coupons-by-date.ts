/**
 * Internal dependencies
 */
import { reportCouponsByDateQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

export function useReportCouponsByDate( params: ReportParams ) {
	return useReport( p => reportCouponsByDateQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'couponsByDate', '__comparison__', 'disabled' ],
	} );
}
