/**
 * Internal dependencies
 */
import { reportVisitorsQuery } from '../queries/report-visitors-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportVisitorsOptions = {
	enabled?: boolean;
};

export function useReportVisitors( params: ReportParams, options?: UseReportVisitorsOptions ) {
	return useReport( p => reportVisitorsQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'visitors', 'by-date', '__comparison__', 'disabled' ],
	} );
}
