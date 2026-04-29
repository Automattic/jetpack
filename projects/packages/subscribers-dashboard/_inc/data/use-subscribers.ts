import { useEffect, useState } from '@wordpress/element';
import { fetchSubscribers } from './api';
import type { SubscribersQueryParams, SubscribersResponse } from './types';

type State = {
	data: SubscribersResponse | null;
	isLoading: boolean;
	error: string | null;
};

/**
 * Subscribers list hook. Server-driven: re-fetches whenever any query param changes.
 *
 * Phase 1 keeps things deliberately simple — no caching, no optimistic updates, no
 * `@tanstack/react-query`. Those land in Phase 4 alongside mutations.
 *
 * @param params - List query params.
 * @return Loading state, response, and error string.
 */
export function useSubscribers( params: SubscribersQueryParams ): State {
	const [ state, setState ] = useState< State >( {
		data: null,
		isLoading: true,
		error: null,
	} );

	const filtersKey = params.filters.join( ',' );

	useEffect( () => {
		let cancelled = false;

		setState( previous => ( { ...previous, isLoading: true, error: null } ) );

		fetchSubscribers( params )
			.then( response => {
				if ( cancelled ) {
					return;
				}
				setState( { data: response, isLoading: false, error: null } );
			} )
			.catch( ( err: Error ) => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: null,
					isLoading: false,
					error: err?.message ?? 'Failed to fetch subscribers',
				} );
			} );

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ params.page, params.perPage, params.sort, params.sortOrder, params.search, filtersKey ] );

	return state;
}
