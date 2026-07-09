/**
 * External dependencies
 */
import {
	OrdersFulfillmentWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { OrdersFulfillmentAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type OrdersFulfillmentRenderAttributes = OrdersFulfillmentAttributes &
	Partial< ReportParamsFieldAttributes >;

type OrdersFulfillmentWidgetProps = WidgetRenderProps< OrdersFulfillmentRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Orders fulfillment widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client, chart
 * theme, and resolved report params; OrdersFulfillmentWidget renders the
 * fulfilled vs unfulfilled orders donut chart.
 *
 * @param {OrdersFulfillmentWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function OrdersFulfillmentRender( {
	attributes = {},
	setError,
}: OrdersFulfillmentWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrdersFulfillmentWidget />
		</WidgetRoot>
	);
}
