/**
 * External dependencies
 */
import { useReportBookings } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { DonutChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildBookingsByAttendanceData, isEmptyPieChartData } from '../../helpers';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * Bookings by Status Widget Component
 *
 * Displays a donut chart showing bookings breakdown by status.
 * Shows the total bookings count in the center with a breakdown in the legend.
 *
 * Statuses include: Booked, Checked In, No Show, and Cancelled.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <BookingsByAttendanceWidget />
 * </WidgetRoot>
 * ```
 */
export function BookingsByAttendanceWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportBookings( reportParams );

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildBookingsByAttendanceData( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	const segmentStyles = useSegmentStyles( chartData );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyPieChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: calendar,
				description: __( 'No bookings in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<Stack className={ styles.container } direction="column" align="center" justify="center">
				<DonutChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					legendData={ legendData }
					showLegend={ true }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: false, decimals: 0 },
					} }
					maxSize={ null }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}
