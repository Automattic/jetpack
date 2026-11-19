/**
 * Internal dependencies
 */
import { PRODUCT_CATALOGUE } from './products';

/**
 * The `/wc/v3/products` details of the products a report listed, minus one in the middle of the
 * ids, so the branch for a product the store has deleted is live in every story and the gap falls
 * where a reviewer sees it rather than at the end of a list.
 *
 * @param {string|undefined} include - The requested product ids, comma separated.
 * @return {unknown} The raw products response.
 */
export function buildProductDetailsResponse( include: string | undefined ): unknown {
	const ids = ( include ?? '' )
		.split( ',' )
		.map( value => Number( value.trim() ) )
		.filter( id => Number.isInteger( id ) && id > 0 );
	const deleted = ids.length > 1 ? Math.floor( ids.length / 2 ) : -1;

	return ids
		.filter( ( _, index ) => index !== deleted )
		.map( id => {
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
