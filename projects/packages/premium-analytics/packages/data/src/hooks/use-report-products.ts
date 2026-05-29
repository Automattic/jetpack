/**
 * Internal dependencies
 */
import { reportProductsQuery } from '../queries/report-products-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

/**
 *
 * @param params
 * @param limit
 */
export function useReportProducts( params: ReportParams, limit = 5 ) {
	return useReport( p => reportProductsQuery( { ...p, limit } ), params, {
		disabledComparisonKey: [ 'reports', 'products', '__comparison__', 'disabled' ],
	} );
}
