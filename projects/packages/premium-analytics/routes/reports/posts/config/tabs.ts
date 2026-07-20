/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';

/**
 * Report tab identifier for the Posts & Pages report page.
 *
 * The IDs are stable and URL-friendly — they persist in the `?section=` search
 * param, mirroring the dashboard and the post-detail page.
 */
export type ReportPostsTabId = 'posts-pages' | 'archives';

/**
 * Default tab shown when the URL has no (or an unknown) tab param.
 */
const DEFAULT_TAB_ID: ReportPostsTabId = 'posts-pages';

/**
 * Canonical tab machinery built from the ordered definitions.
 *
 * Labels are defined once here, as getters resolved at call time, so translations
 * are applied after the i18n locale data has loaded. The generic `defineReportTabs`
 * helper turns these into the `resolve`/`getTabs`/`getTabLabel` API. Mirrors the
 * post-detail tab definitions.
 */
const reportPostsTabs = defineReportTabs< ReportPostsTabId >(
	[
		{ id: 'posts-pages', getLabel: () => __( 'Posts & Pages', 'jetpack-premium-analytics' ) },
		{ id: 'archives', getLabel: () => __( 'Archives', 'jetpack-premium-analytics' ) },
	],
	DEFAULT_TAB_ID
);

/**
 * Get the translated display label for a tab.
 */
export const getTabLabel = reportPostsTabs.getTabLabel;

/**
 * Build the ordered list of tab definitions ({ id, label }), with labels
 * resolved lazily so translations apply after the locale data has loaded.
 */
export const getReportPostsTabs = reportPostsTabs.getTabs;

/**
 * Narrow an arbitrary string to a known tab ID, falling back to the default.
 */
export const resolveTabId = reportPostsTabs.resolve;
