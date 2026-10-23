/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * URL-facing slug of a dashboard tab, e.g. `traffic`. The server registers the tabs, so
 * this is an open string: a surface behind a slug the server does not publish is hidden
 * by `isDashboardSectionAvailable()` rather than refused at compile time.
 */
export type DashboardSectionSlug = string;

/**
 * The tab of the All pages report, whose availability gates the post detail page.
 */
export const POST_DETAIL_SECTION: DashboardSectionSlug = 'traffic';

/**
 * Check whether the dashboard exposes a section.
 *
 * Defaults to true, so a build whose server never published the list keeps every surface:
 * an absent list is "unknown", not "nothing is available".
 *
 * @param section - Slug of the section the surface belongs to.
 * @return Whether the dashboard exposes the section.
 */
export function isDashboardSectionAvailable( section: DashboardSectionSlug ): boolean {
	const sections = getScriptData()?.premium_analytics?.sections;

	return ! Array.isArray( sections ) || sections.includes( section );
}

/**
 * Check whether the reader can open a post detail page, which a shop manager without Stats cannot.
 *
 * @return Whether the post detail route would render rather than redirect.
 */
export function isPostDetailAvailable(): boolean {
	return isDashboardSectionAvailable( POST_DETAIL_SECTION );
}
