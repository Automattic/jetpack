/**
 * External dependencies
 */
import { useReportBookings } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { DonutChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildBookingsByAttendanceData } from '../../helpers';
import { useWidgetError } from '../../hooks';
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

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildBookingsByAttendanceData( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	const segmentStyles = useSegmentStyles( chartData );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
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
					emptyStateIcon={ calendar }
					withTooltips
				/>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
