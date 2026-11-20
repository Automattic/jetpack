/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportBookingsQuery } from '../queries/report-bookings-query';
import { type ReportParams } from '../utils/types';

export function useReportBookings( params: ReportParams ) {
	return useReport( p => reportBookingsQuery( p ), params, {
		disabledComparisonKey: [ 'reports', 'bookings', 'by-date', '__comparison__', 'disabled' ],
	} );
}
