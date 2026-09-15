/**
 * The values and hash rules both dashboard runtimes must agree on.
 *
 * Imported by the wp-build chassis and by the webpack app, so the two cannot
 * drift from each other while both are live.
 */

export const SUBPAGES = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
] as const;

export type Subpage = ( typeof SUBPAGES )[ number ];

export type Tab = 'overview' | 'settings';

export const LOCATION_CHANGE_EVENT = 'jetpack-boost:location-change';

/** Everything that means the location changed; the chassis dispatches the custom one. */
export const LOCATION_EVENTS = [ 'hashchange', 'popstate', LOCATION_CHANGE_EVENT ];

export const SETTINGS_SLOT_ID = 'jb-settings-tab-mount';
export const SUBPAGE_SLOT_ID = 'jb-subpage-mount';

/**
 * Split a hash into its path and query, tolerating `#`, `#/` and trailing slashes.
 *
 * @param hash - Location hash, with or without the leading `#`.
 * @return The bare path and its parsed query.
 */
export function splitHash( hash: string ): { path: string; query: URLSearchParams } {
	const [ path, query = '' ] = hash.replace( /^#/, '' ).split( '?' );

	return {
		path: path.replace( /^\//, '' ).replace( /\/$/, '' ),
		query: new URLSearchParams( query ),
	};
}

/**
 * Read the sub-page out of a hash.
 *
 * @param hash - Location hash.
 * @return The sub-page, or null for the root.
 */
export function getSubpage( hash: string ): Subpage | null {
	const { path } = splitHash( hash );

	return SUBPAGES.find( subpage => subpage === path ) ?? null;
}
