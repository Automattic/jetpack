import {
	SalesByCouponWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type SalesByCouponRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Sales by coupon widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByCouponWidget fetches
 * the coupons report and renders the coupon revenue breakdown.
 */
export default function SalesByCouponRender( { attributes }: SalesByCouponRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}
