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
 * @param productIds - The products to look up, as the report listed them.
 * @return The query the dashboard runs, idle without products.
 */
export function productImagesQuery( productIds: readonly number[] ): ReportQuery< ProductImages > {
	return {
		queryKey: [ 'products', 'images', productIds ],
		queryFn: () => fetchProductImages( productIds ),
		enabled: productIds.length > 0,
		placeholderData: previousData => previousData,
	};
}
