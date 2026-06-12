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

type AverageOrderValueRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Average order value widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the average_order_value metric with a
 * comparison delta and sparkline.
 */
export default function AverageOrderValueRender( { attributes }: AverageOrderValueRenderProps ) {
	const [ error, setError ] = useState< WidgetError >( null );

	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			{ error ? (
				<WidgetErrorNotice error={ error } />
			) : (
				<OrderMetricWidget metricKey="average_order_value" />
			) }
		</WidgetRoot>
	);
}
