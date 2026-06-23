import { OrderMetricWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type RenderProps = {
	attributes?: WidgetRootProps[ 'attributes' ];
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Orders over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the order count metric over time.
 */
export default function OrdersOverTimeRender( { attributes, setError }: RenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } } setError={ setError }>
			<OrderMetricWidget metricKey="orders_no" />
		</WidgetRoot>
	);
}
