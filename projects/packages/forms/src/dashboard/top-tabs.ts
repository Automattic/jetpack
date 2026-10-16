/**
 * The dashboard's top tabs, kept free of other imports so the root route bundle stays small.
 */

export const TOP_TABS = [ 'forms', 'responses' ] as const;

export type TopTab = ( typeof TOP_TABS )[ number ];

/**
 * Where each top tab lands; Responses always opens on the inbox.
 */
export const TOP_TAB_PATHS: Record< TopTab, string > = {
	forms: '/forms',
	responses: '/responses/inbox',
};

/**
 * Narrows a string to a top tab.
 *
 * @param value - Candidate tab name.
 * @return Whether the value names a top tab.
 */
export function isTopTab( value?: string ): value is TopTab {
	return TOP_TABS.some( tab => tab === value );
}
