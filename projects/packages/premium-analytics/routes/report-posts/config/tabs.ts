/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Ordered list of the report's tab IDs.
 *
 * This is the single source of truth for which views exist and in what order.
 * The IDs are stable and URL-friendly — they persist in the `?section=` search
 * param, mirroring the dashboard and the post-detail page.
 */
export const REPORT_POSTS_TAB_IDS = [ 'posts-pages', 'archives' ] as const;

/**
 * Report tab identifier.
 * Derived from REPORT_POSTS_TAB_IDS to keep the union in sync with the source list.
 */
export type ReportPostsTabId = ( typeof REPORT_POSTS_TAB_IDS )[ number ];

/**
 * Default tab shown when the URL has no (or an unknown) tab param.
 */
export const DEFAULT_TAB_ID: ReportPostsTabId = 'posts-pages';

/**
 * A report tab definition.
 */
export type ReportPostsTab = {
	id: ReportPostsTabId;
	label: string;
};

/**
 * Canonical tab definitions with lazy label getters, in display order.
 *
 * Labels are defined once here, as getters resolved at call time, so
 * translations are applied after the i18n locale data has loaded. Mirrors the
 * post-detail tab definitions.
 */
const TAB_DEFINITIONS: ReadonlyArray< {
	id: ReportPostsTabId;
	getLabel: () => string;
} > = [
	{ id: 'posts-pages', getLabel: () => __( 'Posts & Pages', 'jetpack-premium-analytics' ) },
	{ id: 'archives', getLabel: () => __( 'Archives', 'jetpack-premium-analytics' ) },
];

/**
 * Get the translated display label for a tab.
 *
 * @param id - The tab identifier.
 * @return Translated label for the tab.
 */
export function getTabLabel( id: ReportPostsTabId ): string {
	return TAB_DEFINITIONS.find( tab => tab.id === id )?.getLabel() ?? id;
}

/**
 * Get the tabs in display order with translated labels.
 *
 * @return The tab definitions.
 */
export function getReportPostsTabs(): ReportPostsTab[] {
	return TAB_DEFINITIONS.map( ( { id, getLabel } ) => ( { id, label: getLabel() } ) );
}

/**
 * Resolve a raw `?section=` value to a valid tab ID, defaulting unknown values.
 *
 * @param value - The raw search param value.
 * @return The resolved tab ID.
 */
export function resolveTabId( value: string | undefined ): ReportPostsTabId {
	return value && ( REPORT_POSTS_TAB_IDS as readonly string[] ).includes( value )
		? ( value as ReportPostsTabId )
		: DEFAULT_TAB_ID;
}
