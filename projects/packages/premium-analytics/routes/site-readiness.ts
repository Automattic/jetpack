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
 * Defaults to false, unlike the sibling `csv_exports_enabled` flag: showing the
 * video surfaces on a site that cannot produce play data is the empty report
 * this gate exists to remove. Safe to default that way because every path that
 * renders the dashboard runs `Analytics::load_dashboard_components()`, which
 * registers the filter that injects the flag (`src/videopress-availability.php`).
 *
 * @return Whether VideoPress is available on this site.
 */
export function isVideoPressAvailable(): boolean {
	return getScriptData()?.premium_analytics?.has_videopress ?? false;
}
