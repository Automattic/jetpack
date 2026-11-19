/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { isDashboardSectionAvailable } from './dashboard-sections';

/**
 * The `/report/{kind}/{id}` segment for an entry of a post type: the page bound to that type,
 * else the post page, which serves every post type.
 *
 * @param postType - The entry's post type, when the row knows it.
 * @return The page's path.
 */
export function getPostReportKind( postType?: string | null ): string {
	const pages = getScriptData()?.premium_analytics?.single_report_pages;
	if ( ! postType || ! Array.isArray( pages ) ) {
		return 'post';
	}

	const page = pages.find(
		candidate =>
			candidate.entity?.kind === 'postType' &&
			candidate.entity.name === postType &&
			// As the route does: a page behind a section the reader cannot open redirects home.
			( ! candidate.dashboard_section ||
				isDashboardSectionAvailable( candidate.dashboard_section ) )
	);

	return page?.path ?? 'post';
}
