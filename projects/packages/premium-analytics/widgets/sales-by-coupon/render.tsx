/**
 * External dependencies
 */
import {
	SalesByCouponWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { SalesByCouponAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByCouponRenderAttributes = SalesByCouponAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByCouponWidgetProps = WidgetRenderProps< SalesByCouponRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by coupon widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByCouponWidget fetches
 * the coupons report and renders the coupon revenue breakdown.
 *
 * @param {SalesByCouponWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SalesByCouponRender( {
	attributes = {},
	setError,
}: SalesByCouponWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}
