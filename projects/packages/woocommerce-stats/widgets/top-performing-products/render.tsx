/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ProductLeaderboard } from '../../src/components/product-leaderboard';
import { PHYSICAL_PRODUCTS_FILTER } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type TopPerformingProductsAttributes = Record< never, never >;

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
				chartTitle={ __( 'Top performing products', 'jetpack-woocommerce-stats-pkg' ) }
				filter={ PHYSICAL_PRODUCTS_FILTER }
				errorText={ __(
					"We couldn't load product data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				) }
			/>
		</WidgetRoot>
	);
}
