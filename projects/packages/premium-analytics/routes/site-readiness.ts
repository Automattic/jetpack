/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';

/**
 * Check whether Premium Analytics can treat the current site as connected.
 *
 * @return Whether the site is connected for Premium Analytics.
 */
export function isPremiumAnalyticsSiteConnected(): boolean {
	return isSimpleSite() || !! getScriptData()?.connection?.connectionStatus?.isRegistered;
}

/**
 * Check whether Premium Analytics can treat the initial sync as finished.
 *
 * @return Whether initial sync is finished for Premium Analytics.
 */
export function isPremiumAnalyticsInitialSyncFinished(): boolean {
	return (
		isSimpleSite() || ( getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0 ) > 0
	);
}
