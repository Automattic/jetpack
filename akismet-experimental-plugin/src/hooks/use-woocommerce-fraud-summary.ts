/**
 * `useWooCommerceFraudSummary` — wraps the WC fraud summary endpoint.
 *
 * Short-circuits via `enabled: isWooCommerceActive()` so the request never
 * leaves the browser on sites without WooCommerce — the endpoint would
 * 400 with `woocommerce_inactive` anyway, but checking client-side keeps
 * the network panel clean and lets the WooCommercePanel render its empty
 * state without flicker.
 */
import { useQuery } from '@tanstack/react-query';
import { wooFraudSummaryQuery } from '@/data/queries';
import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
import type { StatsInterval } from '@/lib/types';

/**
 * Fetch the WC fraud summary for one interval. No-op when WC isn't active.
 *
 * @param interval - Window the summary covers.
 * @return TanStack query result for `WooFraudSummary`.
 */
export function useWooCommerceFraudSummary( interval: StatsInterval ) {
	return useQuery( {
		...wooFraudSummaryQuery( interval ),
		enabled: isWooCommerceActive(),
	} );
}
