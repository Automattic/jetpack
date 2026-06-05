/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { LegendItem } from '../components';
import type { DonutChartData } from '../components/chart-donut/donut-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

// Color for cancelled status
const CANCELLED_COLOR = 'rgb(240, 240, 240)';

export interface BookingsByAttendanceData {
	chartData: DonutChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Builds chart and legend data for the Bookings by Status widget.
 *
 * @param bookings           - Primary period bookings data
 * @param comparisonBookings - Comparison period bookings data
 */
export function buildBookingsByAttendanceData(
	bookings: ReportDataMap[ 'bookings' ] | undefined,
	comparisonBookings: ReportDataMap[ 'bookings' ] | undefined
): BookingsByAttendanceData {
	if ( ! bookings?.summary ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		};
	}

	const { summary } = bookings;
	const comparisonSummary = comparisonBookings?.summary;

	// Attendance status keys from the bookings summary
	type AttendanceStatusKey =
		| 'attendance_status_booked'
		| 'attendance_status_checked_in'
		| 'attendance_status_no_show'
		| 'status_cancelled';

	// Define status mapping with user-friendly labels
	const statusMap: Array< { key: AttendanceStatusKey; label: string } > = [
		{
			key: 'attendance_status_booked',
			label: __( 'Booked', 'jetpack-premium-analytics' ),
		},
		{
			key: 'attendance_status_checked_in',
			label: __( 'Checked In', 'jetpack-premium-analytics' ),
		},
		{
			key: 'attendance_status_no_show',
			label: __( 'No Show', 'jetpack-premium-analytics' ),
		},
		{
			key: 'status_cancelled',
			label: __( 'Cancelled', 'jetpack-premium-analytics' ),
		},
	];

	// Calculate values for each status
	const statusValues = statusMap.map( status => {
		const value = summary[ status.key ] || 0;
		const comparisonValue = comparisonSummary ? comparisonSummary[ status.key ] || 0 : 0;

		return {
			...status,
			value,
			comparisonValue,
		};
	} );

	// Calculate total bookings across all statuses
	const totalBookings = statusValues.reduce( ( sum, status ) => sum + status.value, 0 );

	const comparisonTotalBookings = statusValues.reduce(
		( sum, status ) => sum + status.comparisonValue,
		0
	);

	// If there are no bookings, return empty state
	if ( totalBookings === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: comparisonTotalBookings,
			legendData: [],
		};
	}

	// Filter out statuses with zero bookings
	const statusesWithData = statusValues.filter( status => status.value > 0 );

	// Build chart data
	const chartData: DonutChartData = statusesWithData.map( status => ( {
		label: status.label,
		value: status.value,
		valueDisplay: formatMetricValue( status.value, 'number', {
			useMultipliers: false,
			decimals: 0,
		} ),
		...( status.key === 'status_cancelled' && { color: CANCELLED_COLOR } ),
	} ) );

	// Build legend data
	const legendData: LegendItem[] = statusesWithData.map( status => ( {
		label: status.label,
		value: status.value,
		displayValue: formatMetricValue( status.value, 'number', {
			useMultipliers: false,
			decimals: 0,
		} ),
		comparison: comparisonBookings ? status.comparisonValue : undefined,
		...( status.key === 'status_cancelled' && { color: CANCELLED_COLOR } ),
	} ) );

	return {
		chartData,
		total: totalBookings,
		comparisonTotal: comparisonTotalBookings,
		legendData,
	};
}
