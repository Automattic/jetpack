/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportCustomersByDateQuery } from '../queries/report-customers-by-date-query';

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
