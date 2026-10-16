/**
 * External dependencies
 */
import { useStatsAppPurchases, type StatsAppPurchase } from '@jetpack-premium-analytics/data';

// Jetpack plans that include Stats views, matching `JETPACK_STATS_COMMERCIAL_PLAN_PREFIXES` in PHP.
const BUNDLED_PLAN_PREFIXES = [ 'jetpack_complete', 'jetpack_growth', 'jetpack_business' ];

const COMMERCIAL_PRODUCT = /^jetpack_stats_(?:monthly|yearly|bi_yearly)$/;

/**
 * What the site already holds of Stats: a commercial tier, any Stats product, a plan that bundles views.
 *
 * @return The ownership flags, the bundled plan's name, and the purchases request state.
 */
export function useStatsOwnership() {
	const { data, isLoading, isError } = useStatsAppPurchases();
	const purchases: StatsAppPurchase[] = Array.isArray( data ) ? data : [];

	// Name the highest plan when a site holds two mid-upgrade.
	const bundledPlan = BUNDLED_PLAN_PREFIXES.map( prefix =>
		purchases.find( purchase => purchase.product_slug.startsWith( prefix ) )
	).find( Boolean );

	return {
		isLoading,
		isError,
		isCommercialOwned: purchases.some( purchase =>
			COMMERCIAL_PRODUCT.test( purchase.product_slug )
		),
		hasAnyStatsPlan: purchases.some( purchase => purchase.is_jetpack_stats_product ),
		bundledPlanName: bundledPlan?.product_name,
	};
}
