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
import type { GrossSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type GrossSalesOverTimeRenderAttributes = GrossSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type GrossSalesOverTimeWidgetProps = WidgetRenderProps< GrossSalesOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Gross sales over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the gross sales metric over time.
 *
 * @param {GrossSalesOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function GrossSalesOverTimeRender( {
	attributes = {},
	setError,
}: GrossSalesOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget
				metricKey="orders_value_gross"
				emptyStateText={ __( 'No sales in this period.', 'jetpack-premium-analytics' ) }
				errorText={ __(
					"We couldn't load gross sales. Please try again in a moment.",
					'jetpack-premium-analytics'
				) }
			/>
		</WidgetRoot>
	);
}
