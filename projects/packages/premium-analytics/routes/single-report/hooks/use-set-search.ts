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

/**
 * A setter for search params a section owns, such as the email tabs' send window. Writes the
 * patch over the current search, so every param it does not name stays, and keeps the route.
 *
 * @return The setter: a patch and whether to replace the history entry.
 */
export function useSetSearch(): (
	patch: Record< string, unknown >,
	options?: { replace?: boolean }
) => void {
	const { stage, commit } = useStagedSearch< Record< string, unknown >, typeof ROUTE_FROM >( {
		from: ROUTE_FROM,
	} );

	return useCallback(
		( patch, options ) => {
			stage( patch );
			commit( { replace: options?.replace ?? false } );
		},
		[ stage, commit ]
	);
}
