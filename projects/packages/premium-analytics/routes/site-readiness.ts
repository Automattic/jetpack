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
 * Defaults to false, unlike the sibling `csv_exports_enabled` flag, because an
 * empty video report is what this gate removes; every dashboard path registers
 * the filter that injects the flag (`src/videopress-availability.php`).
 *
 * @return Whether VideoPress is available on this site.
 */
export function isVideoPressAvailable(): boolean {
	return getScriptData()?.premium_analytics?.has_videopress ?? false;
}

/**
 * URL-facing slug of a dashboard tab, e.g. `traffic`. The server registers the tabs, so
 * this is an open string: a surface behind a slug the server does not publish is hidden
 * by `isDashboardSectionInPreviewScope()` rather than refused at compile time.
 */
export type DashboardSectionSlug = string;

/**
 * Check whether the dashboard exposes a section.
 *
 * Defaults to true, so a build whose server never published the list keeps every surface:
 * an absent list is "not scoped", not "nothing is in scope".
 *
 * @param section - Slug of the section the surface belongs to.
 * @return Whether the dashboard exposes the section.
 */
export function isDashboardSectionInPreviewScope( section: DashboardSectionSlug ): boolean {
	const sections = getScriptData()?.premium_analytics?.preview_sections;

	return ! Array.isArray( sections ) || sections.includes( section );
}
