/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { resolveSectionId, type DashboardSection, type DashboardSectionId } from '../../config';
import { route } from '../../package.json';

/**
 * Mirrors this route's `route.path` from package.json, so the staged-search
 * `from` stays in sync if the mount path ever changes.
 */
const ROUTE_FROM = route.path;

type SectionSearch = Record< string, unknown > & {
	section?: string;
};

type SwitchSearch = (
	id: DashboardSectionId,
	search: Record< string, unknown >
) => Record< string, unknown > | undefined;

/**
 * Read and update the active dashboard section via the `?section=` search
 * param, so sections are deep-linkable. Built on `useStagedSearch`: switching a
 * section is an immediate stage + commit (one history entry per change).
 *
 * `?section=` is validated against the available sections. A miss resolves to
 * the first section by order and the URL is rewritten to it.
 *
 * A URL that names no section shows the first one as of its arrival: when the
 * reader rearranges the tabs, the section on screen stays and the URL names it.
 *
 * @param sections     - The available sections, in order.
 * @param switchSearch - Other search params a switch to a section commits with it.
 * @return The active section slug, a setter to change it, and whether the URL has committed it.
 */
export function useActiveSection(
	sections: DashboardSection[],
	switchSearch?: SwitchSearch
): [ DashboardSectionId, ( id: DashboardSectionId ) => void, boolean ] {
	const { committed, effective, stage, commit } = useStagedSearch<
		SectionSearch,
		typeof ROUTE_FROM
	>( {
		from: ROUTE_FROM,
	} );

	const firstSection = sections[ 0 ]?.slug;
	const [ arrivalSection, setArrivalSection ] = useState< DashboardSectionId >();
	const landingSection =
		committed.section === undefined ? ( arrivalSection ?? firstSection ) : undefined;
	if ( landingSection !== arrivalSection ) {
		setArrivalSection( landingSection );
	}

	const activeSection = resolveSectionId( effective.section ?? landingSection, sections );
	const isCommitted =
		activeSection === resolveSectionId( committed.section ?? landingSection, sections );

	// Rewrite a `?section=` that is unresolvable, or absent once the first tab is another, to
	// the slug actually rendered. Replace instead of push: no history entry for the stale URL.
	useEffect( () => {
		if ( sections.length === 0 ) {
			return;
		}

		const shown = effective.section ?? firstSection;
		if ( shown !== activeSection ) {
			stage( { section: activeSection } );
			commit( { replace: true } );
		}
	}, [ sections.length, firstSection, effective.section, activeSection, stage, commit ] );

	const setActiveSection = useCallback(
		( id: DashboardSectionId ) => {
			// Stage + atomic commit, pushing one history entry per section switch so
			// Back/Forward moves between sections. See useStagedSearch README.
			stage( { ...switchSearch?.( id, committed ), section: id } );
			commit( { replace: false } );
		},
		[ stage, commit, switchSearch, committed ]
	);

	return [ activeSection, setActiveSection, isCommitted ];
}
