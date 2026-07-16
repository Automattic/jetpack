/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { AverageOrderValueAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AverageOrderValueRenderAttributes = AverageOrderValueAttributes &
	Partial< ReportParamsFieldAttributes >;

type AverageOrderValueWidgetProps = WidgetRenderProps< AverageOrderValueRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Average order value widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the average_order_value metric with a
 * comparison delta and sparkline.
 *
 * @param {AverageOrderValueWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AverageOrderValueRender( {
	attributes = {},
	setError,
}: AverageOrderValueWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget
				metricKey="average_order_value"
				emptyStateText={ __( 'No orders in this period.', 'jetpack-premium-analytics' ) }
				errorText={ __(
					"We couldn't load average order value. Please try again in a moment.",
					'jetpack-premium-analytics'
				) }
			/>
		</WidgetRoot>
	);
}
