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
 * Slugs of the dashboard tabs that open while the site has no Jetpack connection.
 *
 * @return The slugs; empty when every tab needs the connection.
 */
export function getConnectionlessSectionSlugs(): string[] {
	return getScriptData()?.premium_analytics?.connectionless_sections ?? [];
}

/**
 * Slugs of the dashboard tabs this site can open: all of them when connected, otherwise those that
 * run without a connection. Without any of those the dashboard sends the reader to `/connect`.
 *
 * @return The slugs, or undefined when the server lists no tabs.
 */
export function getOpenableSectionSlugs(): string[] | undefined {
	const data = getScriptData()?.premium_analytics;
	if ( isPremiumAnalyticsSiteConnected() || ! Array.isArray( data?.connectionless_sections ) ) {
		return data?.sections;
	}
	return data.connectionless_sections;
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
 * Defaults to false, unlike the sibling `csv_exports_enabled` flag, because an
 * empty video report is what this gate removes; every dashboard path registers
 * the filter that injects the flag (`src/videopress-availability.php`).
 *
 * @return Whether VideoPress is available on this site.
 */
export function isVideoPressAvailable(): boolean {
	return getScriptData()?.premium_analytics?.has_videopress ?? false;
}
