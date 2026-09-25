/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Ordered list of the post-detail tab IDs — the single source of truth for
 * which tabs exist and their order. IDs are kept stable and URL-friendly:
 * they persist in the `?section=` param, mirroring the dashboard.
 */
export const POST_DETAIL_TAB_IDS = [ 'post-traffic', 'email-opens', 'email-clicks' ] as const;

/**
 * Post-detail tab identifier.
 */
export type PostDetailTabId = ( typeof POST_DETAIL_TAB_IDS )[ number ];

/**
 * Default tab shown when the URL has no (or an unknown) tab param.
 */
export const DEFAULT_TAB_ID: PostDetailTabId = 'post-traffic';

export type PostDetailTab = {
	id: PostDetailTabId;
	label: string;
};

/**
 * Canonical tab definitions with lazy label getters, in display order.
 * Labels resolve at call time so translations apply once i18n locale data
 * has loaded, mirroring the dashboard's section definitions.
 */
const TAB_DEFINITIONS: ReadonlyArray< {
	id: PostDetailTabId;
	getLabel: () => string;
	/**
	 * Which window the tab reports over: the URL date range, or the fixed
	 * send window pinned by `useEmailTabScope`. `send-window` tabs also take
	 * the email header identity and hide the date filter.
	 */
	scope: 'url' | 'send-window';
} > = [
	{
		id: 'post-traffic',
		getLabel: () => __( 'Post traffic', 'jetpack-premium-analytics-pkg' ),
		scope: 'url',
	},
	{
		id: 'email-opens',
		getLabel: () => __( 'Email opens', 'jetpack-premium-analytics-pkg' ),
		scope: 'send-window',
	},
	{
		id: 'email-clicks',
		getLabel: () => __( 'Email clicks', 'jetpack-premium-analytics-pkg' ),
		scope: 'send-window',
	},
];

/**
 * The tabs that describe the post's newsletter send rather than the post
 * itself — derived from the definitions' `scope`, so a new tab declares its
 * window once and the header identity, date filter, and widget params all
 * follow.
 */
export const EMAIL_TAB_IDS: readonly PostDetailTabId[] = TAB_DEFINITIONS.filter(
	tab => tab.scope === 'send-window'
).map( tab => tab.id );

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
