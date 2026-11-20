/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportCouponsQuery } from '../queries/report-coupons-query';
import { type ReportParams } from '../utils/types';

export function useReportCoupons( params: ReportParams ) {
	return useReport( p => reportCouponsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'coupons', '__comparison__', 'disabled' ],
	} );
}
