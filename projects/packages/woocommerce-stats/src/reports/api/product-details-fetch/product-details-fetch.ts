/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

type ProductImage = {
	url: string;
	alt: string;
};

export type ProductDetails = {
	image: ProductImage;
	permalink: string;
};

type ProductResponse = {
	id: number;
	permalink?: string;
	images?: { src: string; alt: string }[];
};

/**
 * The first image and the public URL of each product, from the store's own products endpoint.
 * A failed request rejects, so the query client can retry it rather than cache "no products".
 *
 * @param productIds - The products to look up.
 * @return The details of each product the store still has, by product id.
 */
export async function fetchProductDetails(
	productIds: readonly number[]
): Promise< Record< number, ProductDetails > > {
	if ( ! productIds.length ) {
		return {};
	}

	const products = await apiFetch< ProductResponse[] >( {
		path: addQueryArgs( '/wc/v3/products', {
			include: productIds.join( ',' ),
			per_page: productIds.length,
		} ),
	} );

	return Object.fromEntries(
		products.map( product => [
			product.id,
			{
				image: {
					url: product.images?.[ 0 ]?.src ?? '',
					alt: product.images?.[ 0 ]?.alt ?? '',
				},
				permalink: product.permalink ?? '',
			},
		] )
	);
}
