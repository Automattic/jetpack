/**
 * External dependencies
 */
import { useReportBookings } from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import { calendar } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { DonutChart, DonutChartSkeleton, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildBookingsByAttendanceData, isEmptyPieChartData } from '../../helpers';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * Donut chart of bookings by status (Booked, Checked In, No Show, Cancelled),
 * with the total count in the center and a breakdown in the legend.
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
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The report queries keep placeholders from the previous period across
			// range changes, so only surface the error when nothing is left to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyPieChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: calendar,
				description: __( 'No bookings in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			renderLoading={ <DonutChartSkeleton /> }
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
