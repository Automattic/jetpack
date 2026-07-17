/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { sanitizeReportProductsResponse } from '../processing/products';
import type { ProductImage } from '../types/product-image';

// Infer the product ID type from the sanitized products response
type ProductId = ReturnType<
	typeof sanitizeReportProductsResponse
>[ 'data' ][ number ][ 'product_id' ];

export interface UseProductImagesParams {
	productIds: ProductId[];
}

export interface ProductImageResponse {
	id: number;
	name: string;
	images: {
		id: number;
		src: string;
		name: string;
		alt: string;
	}[];
}

/**
 * Fetches product images from the WooCommerce REST API
 * @param productIds
 */
async function fetchProductImages(
	productIds: ProductId[]
): Promise< ( ProductImage & { productId: ProductId } )[] > {
	if ( ! productIds.length ) {
		return [];
	}

	// Use the include parameter to get only the products we need
	const queryArgs = {
		include: productIds.join( ',' ),
		per_page: productIds.length,
	};

	try {
		const response = await apiFetch< ProductImageResponse[] >( {
			path: addQueryArgs( '/wc/v3/products', queryArgs ),
		} );

		return response.map( product => ( {
			productId: product.id,
			imageUrl: product.images?.[ 0 ]?.src || '',
			imageAlt: product.images?.[ 0 ]?.alt || product.name,
		} ) );
	} catch {
		return [];
	}
}

const getProductImagesQueryKey = ( params: UseProductImagesParams ) =>
	// Copy before sorting: `sort()` mutates in place, and this runs during render.
	// The sort makes `[ 1, 2 ]` and `[ 2, 1 ]` share a cache entry.
	[ 'product-images', [ ...params.productIds ].sort().join( ',' ) ] as const;

/**
 * Hook to fetch product images for a list of product IDs
 * @param params - Object containing the list of product IDs to fetch images for
 */
export function useProductImages( params: UseProductImagesParams ) {
	return useQuery( {
		queryKey: getProductImagesQueryKey( params ),
		queryFn: async () => {
			const images = await fetchProductImages( params.productIds );
			return images.reduce(
				( acc: Record< number, ProductImage >, image: ProductImage & { productId: number } ) => {
					acc[ image.productId ] = {
						imageUrl: image.imageUrl,
						imageAlt: image.imageAlt,
					};
					return acc;
				},
				{}
			);
		},
		enabled: params.productIds.length > 0,
	} );
}
