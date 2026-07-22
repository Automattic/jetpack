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

	/**
	 * Copy for the empty state.
	 */
	emptyStateText?: string;

	/**
	 * Copy for the error state.
	 */
	errorText?: string;
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
 * @param {object}         props                - Component props
 * @param {OrderMetricKey} props.metricKey      - The metric key to display
 * @param {string}         props.emptyStateText - Copy for the empty state
 * @param {string}         props.errorText      - Copy for the error state
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <BookingOrderMetricWidget metricKey="orders_value_net" />
 * </WidgetRoot>
 * ```
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
