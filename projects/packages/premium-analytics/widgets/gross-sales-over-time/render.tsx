import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type GrossSalesOverTimeRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Gross sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the gross sales metric over time.
 */
export default function GrossSalesOverTimeRender( { attributes }: GrossSalesOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="orders_value_gross" />
		</WidgetRoot>
	);
}
