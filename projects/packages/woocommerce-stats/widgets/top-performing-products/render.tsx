/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { store } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { ProductLeaderboard } from '../../src/components/product-leaderboard';
import { PHYSICAL_PRODUCTS_FILTER } from '../../src/reports';
import type { TopPerformingProductsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TopPerformingProductsRenderAttributes = TopPerformingProductsAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Top performing products widget: physical products by net revenue.
 *
 * @param {WidgetRenderProps< TopPerformingProductsRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function TopPerformingProductsRender( {
	attributes = {},
}: WidgetRenderProps< TopPerformingProductsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ProductLeaderboard
				filter={ PHYSICAL_PRODUCTS_FILTER }
				emptyIcon={ store }
				emptyText={ __( 'No product sales in this period.', 'jetpack-woocommerce-stats-pkg' ) }
				errorText={ __(
					"We couldn't load product data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				) }
			/>
		</WidgetRoot>
	);
}
