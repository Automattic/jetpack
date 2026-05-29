/**
 * Internal dependencies
 */
import { reportCustomersQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

/**
 *
 * @param params
 */
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
