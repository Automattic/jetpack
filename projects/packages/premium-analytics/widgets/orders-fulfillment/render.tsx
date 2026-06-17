import { OrdersFulfillmentWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type OrdersFulfillmentRenderProps = {
	attributes?: ComponentProps< typeof WidgetRoot >[ 'attributes' ];
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Orders fulfillment widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrdersFulfillmentWidget
 * renders the fulfilled vs unfulfilled orders donut chart.
 */
export default function OrdersFulfillmentRender( {
	attributes,
	setError,
}: OrdersFulfillmentRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrdersFulfillmentWidget />
		</WidgetRoot>
	);
}
