/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { ReportMetricWidget } from '../../components/report-metric';
import { useWidgetRootContext } from '../../components/widget-root';
import { getFormatByMetricKey, BOOKINGS_FILTER } from '../../helpers';
import type { OrderMetricKey } from '../../types';

export type BookingOrderMetricWidgetProps = {
	metricKey: OrderMetricKey;

	emptyStateText?: string;

	errorText?: string;
};

/**
 * Order metrics over time, filtered to booking product types (booking,
 * bookable-event, bookable-service).
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function BookingOrderMetricWidget( {
	metricKey,
	emptyStateText,
	errorText,
}: BookingOrderMetricWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey={ metricKey }
			data={ useReportOrders( {
				...reportParams,
				filters: [ BOOKINGS_FILTER ],
			} ) }
			dataFormat={ getFormatByMetricKey( metricKey ) }
			emptyStateText={ emptyStateText }
			errorText={ errorText }
		/>
	);
}
