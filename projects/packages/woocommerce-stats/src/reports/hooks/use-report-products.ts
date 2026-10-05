/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportProductsQuery } from '../queries/report-products-query';

export function useReportProducts( params: ReportParams, limit = 5 ) {
	return useReport( p => reportProductsQuery( { ...p, limit } ), params, {
		disabledComparisonKey: [ 'reports', 'products', '__comparison__', 'disabled' ],
	} );
}
