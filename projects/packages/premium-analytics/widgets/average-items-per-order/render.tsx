import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type AverageItemsPerOrderRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Average items per order widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the avg_items metric with a comparison delta
 * and sparkline.
 */
export default function AverageItemsPerOrderRender( {
	attributes,
}: AverageItemsPerOrderRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="avg_items" />
		</WidgetRoot>
	);
}
