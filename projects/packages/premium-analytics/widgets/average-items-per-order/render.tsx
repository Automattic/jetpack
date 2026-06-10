/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useState, type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { WidgetErrorNotice } from './components/widget-error-notice';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

/*
 * Error config reported by toolkit widgets through WidgetRoot's setError
 * channel (`WidgetErrorConfig | true | null`; the type itself is not
 * exported from the toolkit index).
 */
type WidgetError = Parameters< NonNullable< WidgetRootProps[ 'setError' ] > >[ 0 ];

type AverageItemsPerOrderRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Average items per order widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the avg_items metric with a comparison delta
 * and sparkline.
 *
 * The host widget contract (`WidgetRenderProps`) has no error channel, so the
 * widget holds the toolkit's setError state itself and renders an inline
 * notice. Clearing the error remounts OrderMetricWidget, which refetches the
 * errored query on mount.
 */
export default function AverageItemsPerOrderRender( {
	attributes,
}: AverageItemsPerOrderRenderProps ) {
	const [ error, setError ] = useState< WidgetError >( null );

	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			{ error ? (
				<WidgetErrorNotice error={ error } />
			) : (
				<OrderMetricWidget metricKey="avg_items" />
			) }
		</WidgetRoot>
	);
}
