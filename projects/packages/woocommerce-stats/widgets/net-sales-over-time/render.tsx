/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../../src/components/report-metric-chart';
import { useReportOrders } from '../../src/reports';
import type { NetSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type NetSalesOverTimeRenderAttributes = NetSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Net sales of the orders report, read under the widget root for its report params.
 *
 * @return {JSX.Element} The chart.
 */
function NetSalesOverTime() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			field="orders_value_net"
			label={ __( 'Net sales', 'jetpack-woocommerce-stats-pkg' ) }
			dataFormat={ { type: 'currency' } }
			emptyText={ __( 'No sales in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load net sales. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Net sales over time widget.
 *
 * @param {WidgetRenderProps< NetSalesOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function NetSalesOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< NetSalesOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<NetSalesOverTime />
		</WidgetRoot>
	);
}
