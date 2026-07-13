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
import type { NetSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type NetSalesOverTimeRenderAttributes = NetSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type NetSalesOverTimeWidgetProps = WidgetRenderProps< NetSalesOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Net sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the net sales metric over time.
 *
 * @param {NetSalesOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function NetSalesOverTimeRender( {
	attributes = {},
	setError,
}: NetSalesOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="orders_value_net" />
		</WidgetRoot>
	);
}
