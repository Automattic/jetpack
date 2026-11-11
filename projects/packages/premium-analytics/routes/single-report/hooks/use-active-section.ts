/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { route } from '../package.json';

const ROUTE_FROM = route.path;

type SectionSearch = {
	section?: string;
};

/**
 * Read and update the active section via the `?section=` search param, the dashboard's
 * deep-linkable model. Switching stages and commits at once: one history entry per change,
 * unless `replace` is set to normalize a deep link.
 *
 * @return The section the URL names, and a setter.
 */
export function useActiveSection(): [
	string | undefined,
	( slug: string, options?: { replace?: boolean } ) => void,
] {
	const { effective, stage, commit } = useStagedSearch< SectionSearch, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	const setActiveSection = useCallback(
		( slug: string, options?: { replace?: boolean } ) => {
			stage( { section: slug } );
			commit( { replace: options?.replace ?? false } );
		},
		[ stage, commit ]
	);

	return [ effective.section, setActiveSection ];
}
