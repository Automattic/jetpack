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
	setError?: Parameters< typeof WidgetRoot >[ 0 ][ 'setError' ];
};

/**
 * Average order value widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the average_order_value metric with a
 * comparison delta and sparkline.
 */
export default function AverageOrderValueRender( {
	attributes,
	setError,
}: AverageOrderValueRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="average_order_value" />
		</WidgetRoot>
	);
}
