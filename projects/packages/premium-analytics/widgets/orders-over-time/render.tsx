/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
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

type OrdersOverTimeRenderProps = WidgetRenderProps< OrdersOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Orders over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the order count metric over time.
 */
export default function OrdersOverTimeRender( {
	attributes = {},
	setError,
}: OrdersOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="orders_no" />
		</WidgetRoot>
	);
}
