/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DataFormat,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportBookings } from '../../src/reports';
import type { BookingsByStatusAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type BookingsByStatusRenderAttributes = BookingsByStatusAttributes &
	Partial< ReportParamsFieldAttributes >;

type AttendanceStatusKey =
	| 'attendance_status_booked'
	| 'attendance_status_checked_in'
	| 'attendance_status_no_show'
	| 'status_cancelled';

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: false, decimals: 0 },
};

/**
 * Bookings by status: Booked, Checked In, No Show and Cancelled. Read under the widget root for its
 * report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function BookingsByStatus() {
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
				label: __( 'Booked', 'jetpack-woocommerce-stats-pkg' ),
			},
			{
				key: 'attendance_status_checked_in',
				label: __( 'Checked In', 'jetpack-woocommerce-stats-pkg' ),
			},
			{
				key: 'attendance_status_no_show',
				label: __( 'No Show', 'jetpack-woocommerce-stats-pkg' ),
			},
			{
				key: 'status_cancelled',
				label: __( 'Cancelled', 'jetpack-woocommerce-stats-pkg' ),
				muted: true,
			},
		];

		// A status with no bookings in the period has no segment.
		return statuses
			.filter( status => ( summary[ status.key ] || 0 ) > 0 )
			.map( status => ( {
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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: calendar,
				description: __( 'No bookings in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
			format={ COUNT_FORMAT }
		/>
	);
}

/**
 * The Bookings by status widget.
 *
 * @param {WidgetRenderProps< BookingsByStatusRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function BookingsByStatusRender( {
	attributes = {},
}: WidgetRenderProps< BookingsByStatusRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<BookingsByStatus />
		</WidgetRoot>
	);
}
