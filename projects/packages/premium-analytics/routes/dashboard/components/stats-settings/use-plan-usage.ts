import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsAppPlanUsage } from '@jetpack-premium-analytics/data';

/**
 * The site's plan usage for the current billing cycle.
 *
 * @return The query state, the limit when there is one to meter against, and the over-limit count to warn about.
 */
export function usePlanUsage() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsAppPlanUsage();

	// Legacy plans and no plan report a null limit, and a zero limit gives nothing to meter against either.
	const limit =
		typeof data?.views_limit === 'number' && data.views_limit > 0 ? data.views_limit : null;

	// VIP sites get a comped Jetpack Complete plan, and Calypso suppresses the over-limit warning for
	// them as a temporary measure (Automattic/wp-calypso#107396), keyed on the site's VIP flag rather than this host guess.
	const isVip = getScriptData()?.site?.host === 'vip';

	return {
		data,
		isLoading,
		isFetching,
		isError,
		refetch,
		limit,
		overLimitMonths: isVip ? null : ( data?.over_limit_months ?? null ),
	};
}
