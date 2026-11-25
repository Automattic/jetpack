/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Count the loads a table has started, so a new period can reset what a background refetch keeps.
 *
 * The report hooks raise `isLoading` only while nothing on screen answers the current params; a
 * revalidation of the same params raises `isFetching` instead.
 *
 * @param isLoading - Whether rows for the current params are still loading.
 * @return A number that changes each time a load starts.
 */
export function useLoadCount( isLoading: boolean ): number {
	const [ state, setState ] = useState( { isLoading, count: 0 } );

	if ( state.isLoading !== isLoading ) {
		const count = isLoading ? state.count + 1 : state.count;
		setState( { isLoading, count } );
		return count;
	}

	return state.count;
}
