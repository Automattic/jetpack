/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportSessionsByDeviceQuery } from '../queries/report-sessions-by-device-query';
import { type ReportParams } from '../utils/types';

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
