/**
 * External dependencies
 */
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
export type PostDetailTab = {
	id: PostDetailTabId;
	label: string;
};

/**
 * Canonical tab definitions with lazy label getters, in display order.
 *
 * Labels are defined once here, as getters resolved at call time, so translations
 * are applied after the i18n locale data has loaded. Mirrors the dashboard's
 * section definitions.
 */
const TAB_DEFINITIONS: ReadonlyArray< {
	id: PostDetailTabId;
	getLabel: () => string;
} > = [
	{ id: 'post-traffic', getLabel: () => __( 'Post traffic', 'jetpack-premium-analytics' ) },
	{ id: 'email-opens', getLabel: () => __( 'Email opens', 'jetpack-premium-analytics' ) },
	{ id: 'email-clicks', getLabel: () => __( 'Email clicks', 'jetpack-premium-analytics' ) },
];

/**
 * Get the translated display label for a tab.
 *
 * @param id - The tab identifier.
 * @return Translated label for the tab.
 */
export function getTabLabel( id: PostDetailTabId ): string {
	return TAB_DEFINITIONS.find( tab => tab.id === id )?.getLabel() ?? id;
}

/**
 * Build the ordered list of tab definitions ({ id, label }).
 *
 * Labels are resolved lazily (at call time) so translations are applied after
 * the i18n locale data has loaded.
 *
 * @return Ordered list of tab definitions.
 */
export function getPostDetailTabs(): PostDetailTab[] {
	return TAB_DEFINITIONS.map( ( { id, getLabel } ) => ( { id, label: getLabel() } ) );
}

/**
 * Narrow an arbitrary string to a known tab ID, falling back to the default.
 *
 * @param value - The candidate tab ID (e.g. from the URL).
 * @return A valid tab ID.
 */
export function resolveTabId( value: string | undefined ): PostDetailTabId {
	return value && ( POST_DETAIL_TAB_IDS as readonly string[] ).includes( value )
		? ( value as PostDetailTabId )
		: DEFAULT_TAB_ID;
}
