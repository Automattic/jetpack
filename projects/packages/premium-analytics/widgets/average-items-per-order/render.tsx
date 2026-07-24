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
import type { AverageItemsPerOrderAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AverageItemsPerOrderRenderAttributes = AverageItemsPerOrderAttributes &
	Partial< ReportParamsFieldAttributes >;

type AverageItemsPerOrderWidgetProps = WidgetRenderProps< AverageItemsPerOrderRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Average items per order widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the avg_items metric with a comparison delta
 * and sparkline.
 *
 * @param {AverageItemsPerOrderWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AverageItemsPerOrderRender( {
	attributes = {},
	setError,
}: AverageItemsPerOrderWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<OrderMetricWidget
				metricKey="avg_items"
				emptyStateText={ __( 'No orders in this period.', 'jetpack-premium-analytics' ) }
				errorText={ __(
					"We couldn't load average items per order. Please try again in a moment.",
					'jetpack-premium-analytics'
				) }
			/>
		</WidgetRoot>
	);
}
