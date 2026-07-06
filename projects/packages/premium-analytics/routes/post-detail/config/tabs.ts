/**
 * External dependencies
 */
import { defineReportTabs, type ReportTab } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';

/**
 * Ordered list of the post-detail tab IDs.
 *
 * This is the single source of truth for which tabs exist and in what order.
 * Each tab is surfaced in the tab bar and renders its own customizable widget
 * grid, so the IDs are kept stable and URL-friendly (they are persisted in the
 * `?section=` search param, mirroring the dashboard).
 */
export const POST_DETAIL_TAB_IDS = [ 'post-traffic', 'email-opens', 'email-clicks' ] as const;

/**
 * Post-detail tab identifier.
 * Derived from POST_DETAIL_TAB_IDS to keep the union in sync with the source list.
 */
export type PostDetailTabId = ( typeof POST_DETAIL_TAB_IDS )[ number ];

/**
 * Default tab shown when the URL has no (or an unknown) tab param.
 */
export const DEFAULT_TAB_ID: PostDetailTabId = 'post-traffic';

/**
 * A post-detail tab definition.
 */
export type PostDetailTab = ReportTab< PostDetailTabId >;

/**
 * Canonical tab machinery built from the ordered definitions.
 *
 * Labels are defined once here, as getters resolved at call time, so translations
 * are applied after the i18n locale data has loaded. The generic `defineReportTabs`
 * helper turns these into the `resolve`/`getTabs`/`getTabLabel` API. Mirrors the
 * dashboard's section definitions.
 */
const postDetailTabs = defineReportTabs< PostDetailTabId >(
	[
		{ id: 'post-traffic', getLabel: () => __( 'Post traffic', 'jetpack-premium-analytics' ) },
		{ id: 'email-opens', getLabel: () => __( 'Email opens', 'jetpack-premium-analytics' ) },
		{ id: 'email-clicks', getLabel: () => __( 'Email clicks', 'jetpack-premium-analytics' ) },
	],
	DEFAULT_TAB_ID
);

/**
 * Get the translated display label for a tab.
 */
export const getTabLabel = postDetailTabs.getTabLabel;

/**
 * Build the ordered list of tab definitions ({ id, label }), with labels
 * resolved lazily so translations apply after the locale data has loaded.
 */
export const getPostDetailTabs = postDetailTabs.getTabs;

/**
 * Narrow an arbitrary string to a known tab ID, falling back to the default.
 */
export const resolveTabId = postDetailTabs.resolve;
