/**
 * Internal dependencies
 */
import { reportBookingsQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

export function useReportBookings( params: ReportParams ) {
	return useReport( p => reportBookingsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'bookings', 'by-date', '__comparison__', 'disabled' ],
	} );
}
