/**
 * Internal dependencies
 */
import { reportCustomersByDateQuery } from '../queries/report-customers-by-date-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportCustomersByDateOptions = {
	enabled?: boolean;
};

export function useReportCustomersByDate(
	params: ReportParams,
	options?: UseReportCustomersByDateOptions
) {
	return useReport( p => reportCustomersByDateQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'customers', 'by-date', '__comparison__', 'disabled' ],
	} );
}
