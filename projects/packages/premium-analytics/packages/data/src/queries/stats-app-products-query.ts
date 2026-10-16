/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsAppPlanPriceTier } from '../hooks/use-stats-app-plan-usage';

export type StatsAppProduct = {
	product_slug: string;
	currency_code: string;
	price_tier_list?: StatsAppPlanPriceTier[] | null;
};

export type StatsAppProductsResponse = Record< string, StatsAppProduct >;

export const statsAppProductsQuery = () =>
	statsAppProxyQuery< StatsAppProductsResponse >( {
		name: 'products',
		version: '1.1',
		endpoint: 'products',
	} );
