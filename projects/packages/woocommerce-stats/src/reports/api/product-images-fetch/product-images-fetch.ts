/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export type ProductImage = {
	url: string;
	alt: string;
};

type ProductResponse = {
	id: number;
	name: string;
	images?: { src: string; alt: string }[];
};

/**
 * The first image of each product, from the store's own products endpoint. A failed request
 * leaves every product without one: the thumbnails are decoration on a report that already answered.
 *
 * @param productIds - The products to look up.
 * @return The image of each product that has one, by product id.
 */
export async function fetchProductImages(
	productIds: readonly number[]
): Promise< Record< number, ProductImage > > {
	if ( ! productIds.length ) {
		return {};
	}

	try {
		const products = await apiFetch< ProductResponse[] >( {
			path: addQueryArgs( '/wc/v3/products', {
				include: productIds.join( ',' ),
				per_page: productIds.length,
			} ),
		} );

		return Object.fromEntries(
			products.map( product => [
				product.id,
				{ url: product.images?.[ 0 ]?.src ?? '', alt: product.images?.[ 0 ]?.alt || product.name },
			] )
		);
	} catch {
		return {};
	}
}
