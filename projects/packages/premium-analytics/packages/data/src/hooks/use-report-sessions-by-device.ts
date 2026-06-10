/**
 * Internal dependencies
 */
import { reportSessionsByDeviceQuery } from '../queries/report-sessions-by-device-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportSessionsByDeviceOptions = {
	enabled?: boolean;
};

/**
 * Hook for fetching sessions by device type report data.
 *
 * Returns a breakdown of website sessions by device category
 * (Mobile, Desktop, Tablet) for the specified date range.
 *
 * @param params  - Report parameters including date range and comparison dates
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * const { primary, comparison, hasComparison, isLoading, hasData } =
 *     useReportSessionsByDevice( reportParams );
 *
 * // Access the data
 * const { summary, data } = primary.data;
 * const totalSessions = summary.total_sessions;
 * ```
 */
export function useReportSessionsByDevice(
	params: ReportParams,
	options?: UseReportSessionsByDeviceOptions
) {
	return useReport( p => reportSessionsByDeviceQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'sessions', 'by-device', '__comparison__', 'disabled' ],
	} );
}
