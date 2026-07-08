/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { AverageOrderValueAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AverageOrderValueRenderAttributes = AverageOrderValueAttributes &
	Partial< ReportParamsFieldAttributes >;

type AverageOrderValueRenderProps = WidgetRenderProps< AverageOrderValueRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Average order value widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the average_order_value metric with a
 * comparison delta and sparkline.
 */
export default function AverageOrderValueRender( {
	attributes = {},
	setError,
}: AverageOrderValueRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget metricKey="average_order_value" />
		</WidgetRoot>
	);
}
