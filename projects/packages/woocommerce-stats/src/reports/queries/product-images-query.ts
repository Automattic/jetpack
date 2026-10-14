/**
 * Internal dependencies
 */
import { fetchProductImages, type ProductImage } from '../api/product-images-fetch';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

export type ProductImages = Record< number, ProductImage >;

/**
 * The first image of each product listed: decoration on a report that already answered, so a
 * failed request leaves every product without one.
 *
 * @param productIds - The products to look up, in any order.
 * @return The query the dashboard runs, idle without products.
 */
export function productImagesQuery( productIds: readonly number[] ): ReportQuery< ProductImages > {
	const ids = [ ...productIds ].sort( ( a, b ) => a - b );

	return {
		queryKey: [ 'products', 'images', ids ],
		queryFn: () => fetchProductImages( ids ),
		enabled: productIds.length > 0,
		placeholderData: previousData => previousData,
	};
}
