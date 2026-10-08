/**
 * External dependencies
 */
import { useReportBookings } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Donut, type DonutSegmentInput } from '../../components';
import { useWidgetRootContext } from '../../components/widget-root';
import { describeError } from '../../helpers';
import type { DataFormat } from '../../types';

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: false, decimals: 0 },
};

type AttendanceStatusKey =
	| 'attendance_status_booked'
	| 'attendance_status_checked_in'
	| 'attendance_status_no_show'
	| 'status_cancelled';

/**
 * Bookings by status: Booked, Checked In, No Show and Cancelled. Renders inside a `WidgetRoot`,
 * which supplies `reportParams` through context.
 */
export function BookingsByAttendanceWidget() {
	const { reportParams } = useWidgetRootContext();

	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportBookings( reportParams );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const segments = useMemo< DonutSegmentInput[] >( () => {
		if ( ! summary ) {
			return [];
		}

		const statuses: Array< { key: AttendanceStatusKey; label: string; muted?: boolean } > = [
			{
				key: 'attendance_status_booked',
				label: __( 'Booked', 'jetpack-premium-analytics-pkg' ),
			},
			{
				key: 'attendance_status_checked_in',
				label: __( 'Checked In', 'jetpack-premium-analytics-pkg' ),
			},
			{
				key: 'attendance_status_no_show',
				label: __( 'No Show', 'jetpack-premium-analytics-pkg' ),
			},
			{
				key: 'status_cancelled',
				label: __( 'Cancelled', 'jetpack-premium-analytics-pkg' ),
				muted: true,
			},
		];

		return statuses.map( status => ( {
			label: status.label,
			value: summary[ status.key ] || 0,
			previousValue: previous?.[ status.key ],
			muted: status.muted,
		} ) );
	}, [ summary, previous ] );

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading,
				isFetching,
				// The report queries keep placeholders from the previous period across
				// range changes, so only surface the error when nothing is left to show.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: calendar,
				description: __( 'No bookings in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ COUNT_FORMAT }
		/>
	);
}
