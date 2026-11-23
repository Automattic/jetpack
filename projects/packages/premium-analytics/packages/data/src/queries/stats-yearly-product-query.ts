/**
 * External dependencies
 */
import { queryOptions } from '@tanstack/react-query';
import type { StatsAppPlanPriceTier } from '../hooks/use-stats-app-plan-usage';

const PRODUCTS_URL = 'https://public-api.wordpress.com/rest/v1.1/products';

const STATS_YEARLY_PRODUCT_SLUG = 'jetpack_stats_yearly';

export type StatsYearlyProduct = {
	/** Yearly price of the first tier, in the currency's major unit. */
	cost: number;
	currency_code: string;
	price_tier_list?: StatsAppPlanPriceTier[] | null;
};

/**
 * React Query options for the yearly Stats product, read from WordPress.com by the browser.
 *
 * Not proxied: a request signed by the site carries no user, so WordPress.com would price it for the site's server instead of the visitor.
 *
 * @param currency - The buyer's checkout currency. Without it WordPress.com prices the product for the visitor's location.
 * @return The query options; `data` is `null` when the product is missing from the list.
 */
export function statsYearlyProductQuery( currency?: string ) {
	return queryOptions< StatsYearlyProduct | null >( {
		queryKey: [ 'stats-yearly-product', currency ?? null ],
		queryFn: async () => {
			const params = new URLSearchParams( { type: 'jetpack' } );
			if ( currency ) {
				params.set( 'currency', currency );
			}

			const response = await globalThis.fetch( `${ PRODUCTS_URL }?${ params }`, {
				credentials: 'omit',
			} );

			if ( ! response.ok ) {
				// The status lets the shared retry rule give up on a permanent failure.
				throw Object.assign( new Error( `Products request failed with ${ response.status }` ), {
					status: response.status,
				} );
			}

			const products = ( await response.json() ) as Record<
				string,
				StatsYearlyProduct | undefined
			>;

			return products[ STATS_YEARLY_PRODUCT_SLUG ] ?? null;
		},
		staleTime: Infinity,
	} );
}
