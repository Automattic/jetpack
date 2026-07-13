/**
 * External dependencies
 */
import {
	RevenueByCustomerTypeWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { RevenueByCustomerTypeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type RevenueByCustomerTypeRenderAttributes = RevenueByCustomerTypeAttributes &
	Partial< ReportParamsFieldAttributes >;

type RevenueByCustomerTypeWidgetProps =
	WidgetRenderProps< RevenueByCustomerTypeRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * Revenue by customer type widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; RevenueByCustomerTypeWidget fetches
 * the customers report and renders the new vs returning revenue breakdown.
 *
 * @param {RevenueByCustomerTypeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function RevenueByCustomerTypeRender( {
	attributes = {},
	setError,
}: RevenueByCustomerTypeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<RevenueByCustomerTypeWidget />
		</WidgetRoot>
	);
}
