/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { resolveSectionId, type DashboardSection, type DashboardSectionId } from '../config';
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
 * Keeping the active section in the URL makes sections deep-linkable and gives
 * the widget grid a single, stable place to read the current section from.
 * Built on the package's `useStagedSearch`, so switching a section is an
 * immediate stage + commit (one history entry per change).
 *
 * The raw `?section=` value is validated against the available sections: a miss
 * (a stale slug, or a currently unavailable section like `store` with
 * WooCommerce off) resolves to the first section by order, and the URL is
 * rewritten in place to the resolved slug.
 *
 * @param sections - The available sections, in order.
 * @return A tuple of the active section slug and a setter to change it.
 */
export function useActiveSection(
	sections: DashboardSection[]
): [ DashboardSectionId, ( id: DashboardSectionId ) => void ] {
	const { effective, stage, commit } = useStagedSearch< SectionSearch, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	const activeSection = resolveSectionId( effective.section, sections );

	// Rewrite an unresolvable `?section=` to the slug actually rendered, so the
	// URL never advertises a section that isn't shown. Replace instead of push:
	// the invalid URL should not survive as a history entry.
	useEffect( () => {
		if ( sections.length === 0 || effective.section === undefined ) {
			return;
		}

		if ( effective.section !== activeSection ) {
			stage( { section: activeSection } );
			commit( { replace: true } );
		}
	}, [ sections.length, effective.section, activeSection, stage, commit ] );

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
