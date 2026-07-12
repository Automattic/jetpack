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
import type { SalesByCouponUsageAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByCouponUsageRenderAttributes = SalesByCouponUsageAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByCouponUsageWidgetProps = WidgetRenderProps< SalesByCouponUsageRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by coupon usage widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByCouponWidget fetches
 * the coupons report and renders the coupon sales breakdown.
 *
 * @param {SalesByCouponUsageWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SalesByCouponUsageRender( {
	attributes = {},
	setError,
}: SalesByCouponUsageWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}
