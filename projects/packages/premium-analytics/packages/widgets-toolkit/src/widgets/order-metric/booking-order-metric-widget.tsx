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
	/**
	 * The metric key to display from the data
	 */
	metricKey: OrderMetricKey;
};

/**
 * Booking Order Metric Widget Component
 *
 * A widget that displays booking order-related metrics over time with comparison support.
 * This component automatically filters data to show only booking product types
 * (booking, bookable-event, bookable-service).
 *
 * This component must be used within a WidgetRoot which provides reportParams
 * via context.
 *
 * @param {object}         props           - Component props
 * @param {OrderMetricKey} props.metricKey - The metric key to display
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <BookingOrderMetricWidget metricKey="orders_value_net" />
 * </WidgetRoot>
 * ```
 */
export function BookingOrderMetricWidget( { metricKey }: BookingOrderMetricWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey={ metricKey }
			data={ useReportOrders( {
				...reportParams,
				filters: [ BOOKINGS_FILTER ],
			} ) }
			dataFormat={ getFormatByMetricKey( metricKey ) }
		/>
	);
}
