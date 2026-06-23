import { OrderMetricWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;
type RenderProps = Pick< WidgetRootProps, 'attributes' > & {
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Total sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders total sales over time.
 */
export default function TotalSalesOverTimeRender( { attributes, setError }: RenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="total_sales" />
		</WidgetRoot>
	);
}
