import { OrderMetricWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type GrossSalesOverTimeRenderProps = {
	attributes?: WidgetRootProps[ 'attributes' ];
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Gross sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the gross sales metric over time.
 */
export default function GrossSalesOverTimeRender( {
	attributes,
	setError,
}: GrossSalesOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="orders_value_gross" />
		</WidgetRoot>
	);
}
