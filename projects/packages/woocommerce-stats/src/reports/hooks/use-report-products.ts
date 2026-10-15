/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportProductsQuery } from '../queries/report-products-query';
import { type ReportParams } from '../utils/types';

export function useReportProducts( params: ReportParams, limit = 5 ) {
	return useReport( p => reportProductsQuery( { ...p, limit } ), params, {
		disabledComparisonKey: [ 'reports', 'products', '__comparison__', 'disabled' ],
	} );
}
