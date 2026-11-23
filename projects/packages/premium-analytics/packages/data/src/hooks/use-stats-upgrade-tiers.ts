/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getAvailableUpgradeTiers } from '../processing/stats/upgrade-tiers';
import { useStatsAppPlanUsage } from './use-stats-app-plan-usage';
import { useStatsYearlyProduct } from './use-stats-yearly-product';

export type { StatsUpgradeTier } from '../processing/stats/upgrade-tiers';

/** The Stats tiers the site can upgrade to, priced in the current user's checkout currency. */
export function useStatsUpgradeTiers() {
	const productQuery = useStatsYearlyProduct();
	const usage = useStatsAppPlanUsage();

	const product = productQuery.data;
	const tiers = useMemo(
		() => getAvailableUpgradeTiers( product?.price_tier_list, usage.data ),
		[ product?.price_tier_list, usage.data ]
	);

	return {
		tiers,
		currencyCode: product?.currency_code,
		// Without usage the purchased tiers would be offered again, so it gates the tiers too.
		isLoading: productQuery.isLoading || usage.isLoading,
		isError: productQuery.isError || usage.isError,
	};
}
