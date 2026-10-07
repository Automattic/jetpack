/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportOrdersQuery } from '../queries/report-orders-query';
import { type ReportParams } from '../utils/types';

type UseReportOrdersOptions = {
	enabled?: boolean;
};

export function useReportOrders( params: ReportParams, options?: UseReportOrdersOptions ) {
	return useReport( p => reportOrdersQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'orders', 'by-date', '__comparison__', 'disabled' ],
	} );
}
