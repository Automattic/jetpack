/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportSessionsByDeviceQuery } from '../queries/report-sessions-by-device-query';

type UseReportSessionsByDeviceOptions = {
	enabled?: boolean;
};

/** Breaks website sessions down by device category (Mobile, Desktop, Tablet). */
export function useReportSessionsByDevice(
	params: ReportParams,
	options?: UseReportSessionsByDeviceOptions
) {
	return useReport( p => reportSessionsByDeviceQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'sessions', 'by-device', '__comparison__', 'disabled' ],
	} );
}
