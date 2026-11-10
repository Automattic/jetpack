/**
 * External dependencies
 */
import { queryOptions } from '@tanstack/react-query';

const PRODUCTS_URL = 'https://public-api.wordpress.com/rest/v1.1/products?type=jetpack';

const STATS_YEARLY_PRODUCT_SLUG = 'jetpack_stats_yearly';

export type StatsYearlyProduct = {
	/** Yearly price of the first tier, in the currency's major unit. */
	cost: number;
	currency_code: string;
};

/**
 * React Query options for the yearly Stats product, read from WordPress.com without the site's connection.
 *
 * Fetched by the browser rather than through the proxy, which needs a connected site; the endpoint answers anonymous cross-origin requests and prices them for the visitor's location.
 *
 * @return The query options; `data` is `null` when the product is missing from the list.
 */
export function statsYearlyProductQuery() {
	return queryOptions< StatsYearlyProduct | null >( {
		queryKey: [ 'stats-yearly-product' ],
		queryFn: async () => {
			const response = await globalThis.fetch( PRODUCTS_URL, { credentials: 'omit' } );

			if ( ! response.ok ) {
				throw new Error( `Products request failed with ${ response.status }` );
			}

			const products = ( await response.json() ) as Record<
				string,
				StatsYearlyProduct | undefined
			>;

			return products[ STATS_YEARLY_PRODUCT_SLUG ] ?? null;
		},
		staleTime: Infinity,
		// The price only decorates the paid column, so a failure settles on hiding it rather than waiting.
		retry: false,
	} );
}
