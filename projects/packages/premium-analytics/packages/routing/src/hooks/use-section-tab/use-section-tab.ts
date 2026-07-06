/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useStagedSearch } from '../use-staged-search';

type SectionSearch = {
	section?: string;
};

/**
 * Read and update the active section/tab via the `?section=` search param.
 *
 * Report pages that split their content into tabs share one deep-linkable model
 * for their tab state, persisted in the `?section=` param and built on
 * `useStagedSearch`. Switching a tab is an immediate stage + commit with
 * `{ replace: false }`, so each change is one browser-history entry. The active
 * tab is read back from the effective (committed + staged) state.
 *
 * The raw `section` value is narrowed by the caller-supplied `resolve` so an
 * unknown or missing value falls back to the page's default tab.
 *
 * @param routeFrom - The route's `route.path` (the staged-search `from`).
 * @param resolve   - Narrows a raw `section` value to a known tab ID.
 * @return A tuple of the active tab ID and a setter to change it.
 */
export function useSectionTab< TabId extends string >(
	routeFrom: string,
	resolve: ( value: string | undefined ) => TabId
): [ TabId, ( id: TabId ) => void ] {
	const { effective, stage, commit } = useStagedSearch< SectionSearch, string >( {
		from: routeFrom,
	} );

	const activeTab = resolve( effective.section );

	const setActiveTab = useCallback(
		( id: TabId ) => {
			stage( { section: id } );
			commit( { replace: false } );
		},
		[ stage, commit ]
	);

	return [ activeTab, setActiveTab ];
}
