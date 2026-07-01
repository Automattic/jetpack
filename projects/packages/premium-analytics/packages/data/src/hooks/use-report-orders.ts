/**
 * Internal dependencies
 */
import { reportOrdersQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportOrdersOptions = {
	enabled?: boolean;
};

export function useReportOrders( params: ReportParams, options?: UseReportOrdersOptions ) {
	return useReport( p => reportOrdersQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'orders', 'by-date', '__comparison__', 'disabled' ],
	} );
}
