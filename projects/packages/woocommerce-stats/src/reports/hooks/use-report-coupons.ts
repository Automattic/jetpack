/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportCouponsQuery } from '../queries/report-coupons-query';

export function useReportCoupons( params: ReportParams ) {
	return useReport( p => reportCouponsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'coupons', '__comparison__', 'disabled' ],
	} );
}
