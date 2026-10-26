/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsAppPlanPriceTier } from '../hooks/use-stats-app-plan-usage';

type StatsAppProduct = {
	product_slug: string;
	currency_code: string;
	price_tier_list?: StatsAppPlanPriceTier[] | null;
};

type StatsAppProductsResponse = Record< string, StatsAppProduct >;

/**
 * The Jetpack product price list.
 *
 * @param currency - The buyer's checkout currency. Without it WordPress.com prices the list for the visitor's location.
 * @return The query options.
 */
export const statsAppProductsQuery = ( currency?: string ) =>
	statsAppProxyQuery< StatsAppProductsResponse >( {
		name: 'products',
		version: '1.1',
		endpoint: 'products',
		params: currency ? { currency } : undefined,
	} );
