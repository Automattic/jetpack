/**
 * External dependencies
 */
import {
	CouponUseWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { CouponUsageOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type CouponUsageOverTimeRenderAttributes = CouponUsageOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type CouponUsageOverTimeWidgetProps = WidgetRenderProps< CouponUsageOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Coupon usage over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; CouponUseWidget fetches the
 * coupons-by-date report and renders the coupon usage breakdown.
 *
 * @param {CouponUsageOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function CouponUsageOverTimeRender( {
	attributes = {},
	setError,
}: CouponUsageOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<CouponUseWidget />
		</WidgetRoot>
	);
}
