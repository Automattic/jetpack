/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getAvailableUpgradeTiers } from '../processing/stats/upgrade-tiers';
import { statsAppProductsQuery } from '../queries/stats-app-products-query';
import { useStatsAppPlanUsage } from './use-stats-app-plan-usage';
import { useStatsAppQuery } from './use-stats-app-query';

const STATS_COMMERCIAL_PRODUCT = 'jetpack_stats_yearly';

export type { StatsUpgradeTier } from '../processing/stats/upgrade-tiers';

/** The Stats tiers the site can upgrade to, priced in the site's checkout currency. */
export function useStatsUpgradeTiers() {
	const products = useStatsAppQuery( statsAppProductsQuery() );
	const usage = useStatsAppPlanUsage();

	const product = products.data?.[ STATS_COMMERCIAL_PRODUCT ];
	const tiers = useMemo(
		() => getAvailableUpgradeTiers( product?.price_tier_list, usage.data ),
		[ product?.price_tier_list, usage.data ]
	);

	return {
		tiers,
		currencyCode: product?.currency_code,
		// Without usage the purchased tiers would be offered again, so it gates the tiers too.
		isLoading: products.isLoading || usage.isLoading,
		isError: products.isError || usage.isError,
	};
}
