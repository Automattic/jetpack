import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type TotalSalesOverTimeRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Total sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders total sales over time.
 */
export default function TotalSalesOverTimeRender( { attributes }: TotalSalesOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="total_sales" />
		</WidgetRoot>
	);
}
