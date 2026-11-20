/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportVisitorsQuery } from '../queries/report-visitors-query';
import { type ReportParams } from '../utils/types';

type UseReportVisitorsOptions = {
	enabled?: boolean;
};

export function useReportVisitors( params: ReportParams, options?: UseReportVisitorsOptions ) {
	return useReport( p => reportVisitorsQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'visitors', 'by-date', '__comparison__', 'disabled' ],
	} );
}
