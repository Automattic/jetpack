/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { resolveTabId, type PostDetailTabId } from '../config';
import { route } from '../package.json';

/**
 * Mirrors this route's `route.path` from package.json, so the staged-search
 * `from` stays in sync if the mount path ever changes.
 */
const ROUTE_FROM = route.path;

type TabSearch = {
	section?: string;
};

/**
 * Read and update the active tab via the `?section=` search param.
 *
 * Reuses the dashboard's `section` param name so both pages share one
 * deep-linkable model for their tab state, built on `useStagedSearch`.
 * Switching a tab is an immediate stage + commit — one history entry per
 * change, unless `replace` is set (used to normalize a deep link without
 * polluting history).
 *
 * @return A tuple of the active tab ID and a setter to change it.
 */
export function useActiveTab(): [
	PostDetailTabId,
	( id: PostDetailTabId, options?: { replace?: boolean } ) => void,
] {
	const { effective, stage, commit } = useStagedSearch< TabSearch, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	const activeTab = resolveTabId( effective.section );

	const setActiveTab = useCallback(
		( id: PostDetailTabId, options?: { replace?: boolean } ) => {
			stage( { section: id } );
			commit( { replace: options?.replace ?? false } );
		},
		[ stage, commit ]
	);

	return [ activeTab, setActiveTab ];
}
