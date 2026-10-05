/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportOrdersQuery } from '../queries/report-orders-query';

type UseReportOrdersOptions = {
	enabled?: boolean;
};

export function useReportOrders( params: ReportParams, options?: UseReportOrdersOptions ) {
	return useReport( p => reportOrdersQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'orders', 'by-date', '__comparison__', 'disabled' ],
	} );
}
