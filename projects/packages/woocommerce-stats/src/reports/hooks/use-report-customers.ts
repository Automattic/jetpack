/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportCustomersQuery } from '../queries/report-customers-query';
import { type ReportParams } from '../utils/types';

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
