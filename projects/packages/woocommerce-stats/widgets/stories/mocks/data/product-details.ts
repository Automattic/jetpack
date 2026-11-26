/**
 * Internal dependencies
 */
import { BOOKABLE_CATALOGUE, PRODUCT_CATALOGUE } from './products';

/**
 * A product thumbnail, as an inline SVG rather than a fetched image, so the stories render the
 * same offline and on CI, where every story mounts in headless chromium.
 *
 * @param {number} id   - The product id. 137 is the golden angle, so no two ids on screen share a
 *                      hue; a factor sharing a divisor with 360 does put a pair together.
 * @param {string} name - The product name, whose first character labels the square.
 * @return {string} A `data:` URI for the `src` of an image.
 */
function thumbnailDataUri( id: number, name: string ): string {
	const hue = ( id * 137 ) % 360;
	const initial =
		name
			.replace( /[^a-z0-9]/gi, '' )
			.charAt( 0 )
			.toUpperCase() || '?';
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="hsl(${ hue } 48% 74%)"/><text x="48" y="48" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="44" fill="hsl(${ hue } 56% 26%)">${ initial }</text></svg>`;

	return `data:image/svg+xml,${ encodeURIComponent( svg ) }`;
}

/**
 * The `/wc/v3/products` details of the products a report listed, minus one in the middle of the
 * ids, so every story exercises the branch for a product the store has deleted.
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
			const product = [ ...PRODUCT_CATALOGUE, ...BOOKABLE_CATALOGUE ].find(
				candidate => candidate.id === id
			);

			return {
				id,
				permalink: product
					? `https://example.com/product/${ product.slug }/`
					: `https://example.com/?post_type=product&p=${ id }`,
				images: [
					{
						src: thumbnailDataUri( id, product?.name ?? '' ),
						alt: product?.name ?? '',
					},
				],
			};
		} );
}
