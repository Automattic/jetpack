/**
 * Internal dependencies
 */
import { PRODUCT_CATALOGUE } from './products';

/**
 * The `/wc/v3/products` details of the products a report listed, minus the last id asked for, so
 * the branch for a product the store has deleted is live in every story.
 *
 * @param {string|undefined} include - The requested product ids, comma separated.
 * @return {unknown} The raw products response.
 */
export function buildProductDetailsResponse( include: string | undefined ): unknown {
	const ids = ( include ?? '' )
		.split( ',' )
		.map( value => Number( value.trim() ) )
		.filter( id => Number.isInteger( id ) && id > 0 );

	return ids.slice( 0, -1 ).map( id => {
		const product = PRODUCT_CATALOGUE.find( candidate => candidate.id === id );

		return {
			id,
			permalink: product
				? `https://example.com/product/${ product.slug }/`
				: `https://example.com/?post_type=product&p=${ id }`,
			images: [
				{
					src: `https://picsum.photos/seed/${ id }/96/96`,
					alt: product?.name ?? '',
				},
			],
		};
	} );
}
