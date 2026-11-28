/**
 * `calypso/lib/route-modal` over the hash router: a modal is open while `?<key>=<value>` is in the route.
 */
import { useCallback } from 'react';
import page, { useRoute } from './router';

/**
 * Open, close and read a query-param-driven modal.
 *
 * @param queryKey     - Query parameter.
 * @param defaultValue - Value written when opening.
 * @return Modal state and actions.
 */
export function useRouteModal( queryKey: string, defaultValue: string | boolean = true ) {
	const { pathname, query, previousPath } = useRoute();
	const value = query[ queryKey ];

	const openModal = useCallback(
		( modalValue?: string ) => {
			const params = new URLSearchParams( query );
			params.set( queryKey, String( modalValue ?? defaultValue ) );
			page( `${ pathname }?${ params }` );
		},
		[ pathname, query, queryKey, defaultValue ]
	);

	const closeModal = useCallback( () => {
		if ( previousPath ) {
			page.back();
			return;
		}
		const params = new URLSearchParams( query );
		params.delete( queryKey );
		const search = params.toString();
		page( search ? `${ pathname }?${ search }` : pathname );
	}, [ pathname, query, queryKey, previousPath ] );

	return {
		isModalOpen: value !== undefined && value === String( defaultValue ),
		value,
		openModal,
		closeModal,
	};
}
