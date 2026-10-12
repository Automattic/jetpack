/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportCustomersByDateQuery } from '../queries/report-customers-by-date-query';
import { type ReportParams } from '../utils/types';

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
