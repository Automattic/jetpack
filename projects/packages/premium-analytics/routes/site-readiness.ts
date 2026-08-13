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

/**
 * Check whether the site's VideoPress-backed surfaces should be shown.
 *
 * The flag is injected by `src/videopress-availability.php` on the same request
 * that renders the dashboard, so a missing value means the package never
 * booted rather than a site that has VideoPress.
 *
 * @return Whether VideoPress is available on this site.
 */
export function isVideoPressAvailable(): boolean {
	return getScriptData()?.premium_analytics?.has_videopress ?? false;
}
