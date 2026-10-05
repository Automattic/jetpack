/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportVisitorsQuery } from '../queries/report-visitors-query';

type UseReportVisitorsOptions = {
	enabled?: boolean;
};

export function useReportVisitors( params: ReportParams, options?: UseReportVisitorsOptions ) {
	return useReport( p => reportVisitorsQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'visitors', 'by-date', '__comparison__', 'disabled' ],
	} );
}
