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
 * URL-facing slugs of the dashboard tabs, mirroring the section ids in `src/dashboard-layout.php`.
 *
 * A rename on the PHP side would hide every report behind that tab in silence, so
 * `Dashboard_Section_Test::test_preview_scope_sections_list_every_tab_when_unscoped` pins it there.
 */
export const DASHBOARD_SECTION_SLUGS = [
	'traffic',
	'insights',
	'subscribers',
	'store',
	'ads',
] as const;

export type DashboardSectionSlug = ( typeof DASHBOARD_SECTION_SLUGS )[ number ];

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
