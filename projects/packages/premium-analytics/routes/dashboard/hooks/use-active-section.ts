/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { resolveSectionId, type DashboardSectionId } from '../config';
import { route } from '../package.json';

/**
 * Mirrors this route's `route.path` from package.json, so the staged-search
 * `from` stays in sync if the mount path ever changes.
 */
const ROUTE_FROM = route.path;

type SectionSearch = {
	section?: string;
};

/**
 * Read and update the active dashboard section via the `?section=` search param.
 *
 * Keeping the active section in the URL makes sections deep-linkable and gives the
 * future Dashboard/widget integration a single, stable place to read the
 * current section from. Built on the package's `useStagedSearch` so the section
 * shares the same search-param model as the date filters; switching a section is an
 * immediate stage + commit (one history entry per change).
 *
 * @return A tuple of the active section ID and a setter to change it.
 */
export function useActiveSection(): [ DashboardSectionId, ( id: DashboardSectionId ) => void ] {
	const { effective, stage, commit } = useStagedSearch< SectionSearch, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	const activeSection = resolveSectionId( effective.section );

	const setActiveSection = useCallback(
		( id: DashboardSectionId ) => {
			// Stage + atomic commit, pushing one history entry per section switch so
			// Back/Forward moves between sections. See useStagedSearch README.
			stage( { section: id } );
			commit( { replace: false } );
		},
		[ stage, commit ]
	);

	return [ activeSection, setActiveSection ];
}
