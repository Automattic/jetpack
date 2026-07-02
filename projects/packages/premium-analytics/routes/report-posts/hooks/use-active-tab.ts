/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { resolveTabId, type ReportPostsTabId } from '../config';
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
 * Reuses the dashboard's `section` param name so all analytics pages share one
 * deep-linkable model for their tab state, built on `useStagedSearch`.
 * Switching a tab is an immediate stage + commit (one history entry per
 * change).
 *
 * @return A tuple of the active tab ID and a setter to change it.
 */
export function useActiveTab(): [ ReportPostsTabId, ( id: ReportPostsTabId ) => void ] {
	const { effective, stage, commit } = useStagedSearch< TabSearch, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	const activeTab = resolveTabId( effective.section );

	const setActiveTab = useCallback(
		( id: ReportPostsTabId ) => {
			stage( { section: id } );
			commit( { replace: false } );
		},
		[ stage, commit ]
	);

	return [ activeTab, setActiveTab ];
}
