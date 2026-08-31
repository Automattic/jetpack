/**
 * Internal dependencies
 */
import { reportCouponsQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

export function useReportCoupons( params: ReportParams ) {
	return useReport( p => reportCouponsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'coupons', '__comparison__', 'disabled' ],
	} );
}
