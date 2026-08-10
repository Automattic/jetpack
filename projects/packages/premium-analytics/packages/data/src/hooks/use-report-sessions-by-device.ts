/**
 * Internal dependencies
 */
import { reportSessionsByDeviceQuery } from '../queries/report-sessions-by-device-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

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
