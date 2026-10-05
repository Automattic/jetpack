/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportBookingsQuery } from '../queries/report-bookings-query';

export function useReportBookings( params: ReportParams ) {
	return useReport( p => reportBookingsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'bookings', 'by-date', '__comparison__', 'disabled' ],
	} );
}
