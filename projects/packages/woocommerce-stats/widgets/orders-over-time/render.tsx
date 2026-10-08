/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../../src/components/report-metric-chart';
import { useReportOrders } from '../../src/reports';
import type { OrdersOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type OrdersOverTimeRenderAttributes = OrdersOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

const countLabel = ( count: number ) =>
	/* translators: %s: number of orders. */
	_n( '%s Order', '%s Orders', count, 'jetpack-woocommerce-stats-pkg' );

/**
 * Orders of the orders report, read under the widget root for its report params.
 *
 * @return {JSX.Element} The chart.
 */
function OrdersOverTime() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			field="orders_no"
			label={ __( 'Orders', 'jetpack-woocommerce-stats-pkg' ) }
			countLabel={ countLabel }
			dataFormat={ { type: 'number' } }
			emptyText={ __( 'No orders in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load orders. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Orders over time widget.
 *
 * @param {WidgetRenderProps< OrdersOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function OrdersOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< OrdersOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<OrdersOverTime />
		</WidgetRoot>
	);
}
