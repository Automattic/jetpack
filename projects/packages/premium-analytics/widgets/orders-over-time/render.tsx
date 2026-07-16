/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { OrdersOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type OrdersOverTimeRenderAttributes = OrdersOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type OrdersOverTimeWidgetProps = WidgetRenderProps< OrdersOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Orders over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the order count metric over time.
 *
 * @param {OrdersOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function OrdersOverTimeRender( {
	attributes = {},
	setError,
}: OrdersOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget
				metricKey="orders_no"
				emptyStateText={ __( 'No orders in this period.', 'jetpack-premium-analytics' ) }
				errorText={ __(
					"We couldn't load orders. Please try again in a moment.",
					'jetpack-premium-analytics'
				) }
			/>
		</WidgetRoot>
	);
}
