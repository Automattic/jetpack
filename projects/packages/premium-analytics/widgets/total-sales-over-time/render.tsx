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
import type { TotalSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type TotalSalesOverTimeRenderAttributes = TotalSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type TotalSalesOverTimeWidgetProps = WidgetRenderProps< TotalSalesOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Total sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders total sales over time.
 *
 * @param {TotalSalesOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TotalSalesOverTimeRender( {
	attributes = {},
	setError,
}: TotalSalesOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="total_sales" />
		</WidgetRoot>
	);
}
