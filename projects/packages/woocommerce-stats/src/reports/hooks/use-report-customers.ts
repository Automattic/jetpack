/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportCustomersQuery } from '../queries/report-customers-query';

export function useReportCustomers( params: ReportParams ) {
	return useReport( p => reportCustomersQuery( p ), params, {
		disabledComparisonKey: [
			'reports',
			'customers',
			'new-returning',
			'__comparison__',
			'disabled',
		],
	} );
}
