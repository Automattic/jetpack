import { SalesByCouponWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type SalesByCouponUsageRenderProps = {
	attributes?: WidgetRootProps[ 'attributes' ];
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Sales by coupon usage widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByCouponWidget fetches
 * the coupons report and renders the coupon sales breakdown.
 */
export default function SalesByCouponUsageRender( {
	attributes,
	setError,
}: SalesByCouponUsageRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}
