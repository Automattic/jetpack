/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Params that skip the proxy's read cache on the load returning from a Stats checkout, which has
 * just changed the plan usage and purchases the cache still holds.
 *
 * @return `{ force_refresh: 1 }` on that load, otherwise nothing.
 */
export function checkoutReturnParams(): { force_refresh?: 1 } {
	return getScriptData()?.premium_analytics?.purchase_success ? { force_refresh: 1 } : {};
}
