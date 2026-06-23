import { OrderMetricWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type NetSalesOverTimeRenderProps = {
	attributes?: ComponentProps< typeof WidgetRoot >[ 'attributes' ];
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Net sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the net sales metric over time.
 */
export default function NetSalesOverTimeRender( {
	attributes,
	setError,
}: NetSalesOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="orders_value_net" />
		</WidgetRoot>
	);
}
