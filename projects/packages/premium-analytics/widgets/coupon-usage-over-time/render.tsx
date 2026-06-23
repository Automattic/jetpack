import type { ComponentProps } from 'react';
import {
	CouponUseWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type CouponUsageOverTimeRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Coupon usage over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; CouponUseWidget fetches the
 * coupons-by-date report and renders the coupon usage breakdown.
 */
export default function CouponUsageOverTimeRender( {
	attributes,
	setError,
}: CouponUsageOverTimeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<CouponUseWidget />
		</WidgetRoot>
	);
}
