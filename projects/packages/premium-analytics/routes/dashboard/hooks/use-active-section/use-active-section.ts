/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback, useEffect } from 'react';
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
 * @param sections     - The available sections, in order.
 * @param stageSlugs   - Slugs of the tabs the stage renders itself.
 * @param switchSearch - Other search params a switch to a section commits with it.
 * @return The active section slug, a setter to change it, and whether the URL has committed it.
 */
export function useActiveSection(
	sections: DashboardSection[],
	stageSlugs: readonly string[] = [],
	switchSearch?: SwitchSearch
): [ DashboardSectionId, ( id: DashboardSectionId ) => void, boolean ] {
	const { committed, effective, stage, commit } = useStagedSearch<
		SectionSearch,
		typeof ROUTE_FROM
	>( {
		from: ROUTE_FROM,
	} );

	const activeSection = resolveSectionId( effective.section, sections, stageSlugs );
	const isCommitted = activeSection === resolveSectionId( committed.section, sections, stageSlugs );

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
			stage( { ...switchSearch?.( id, committed ), section: id } );
			commit( { replace: false } );
		},
		[ stage, commit, switchSearch, committed ]
	);

	return [ activeSection, setActiveSection, isCommitted ];
}
