/**
 * Internal dependencies
 */
import { fetchProductDetails, type ProductDetails } from '../api/product-details-fetch';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

export type ProductDetailsById = Record< number, ProductDetails >;

/**
 * The image and public URL of each product listed, idle without products.
 *
 * @param productIds - The products to look up, in any order.
 * @return The query the dashboard runs.
 */
export function productDetailsQuery(
	productIds: readonly number[]
): ReportQuery< ProductDetailsById > {
	const ids = [ ...productIds ].sort( ( a, b ) => a - b );

	return {
		queryKey: [ 'products', 'details', ids ],
		queryFn: () => fetchProductDetails( ids ),
		enabled: productIds.length > 0,
		placeholderData: previousData => previousData,
	};
}
