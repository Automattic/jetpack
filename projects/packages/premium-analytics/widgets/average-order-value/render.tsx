/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type AverageOrderValueRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Average order value widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the average_order_value metric with a
 * comparison delta and sparkline.
 */
export default function AverageOrderValueRender( { attributes }: AverageOrderValueRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<OrderMetricWidget metricKey="average_order_value" />
		</WidgetRoot>
	);
}
