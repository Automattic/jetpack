import { SalesByCouponWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type SalesByCouponRenderProps = Pick<
	ComponentProps< typeof WidgetRoot >,
	'attributes' | 'setError'
>;

/**
 * Sales by coupon widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByCouponWidget fetches
 * the coupons report and renders the coupon revenue breakdown.
 *
 * @param root0            - Widget render props.
 * @param root0.attributes - Dashboard-provided widget attributes.
 * @param root0.setError   - Dashboard error-state setter.
 * @return The rendered Sales by coupon widget.
 */
export default function SalesByCouponRender( { attributes, setError }: SalesByCouponRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}
