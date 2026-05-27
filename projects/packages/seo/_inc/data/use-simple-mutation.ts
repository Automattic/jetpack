/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

type QueryParams< T, V > = {
	name: string;
	query: APIFetchOptions< true >;
	invalidates?: string[];
	options?: Pick< UseMutationOptions< T, Error, V >, 'onSuccess' | 'onError' >;
};

/**
 * Thin TanStack Query wrapper for wp-api write requests.
 *
 * `invalidates` lists query names to invalidate on success — e.g. mutating
 * /settings should invalidate the cached /overview response so the home
 * base re-renders with fresh numbers.
 */
const useSimpleMutation = < T = unknown, V = unknown >( {
	name,
	query,
	invalidates = [],
	options,
}: QueryParams< T, V > ) => {
	const queryClient = useQueryClient();
	return useMutation< T, Error, V >( {
		mutationKey: [ name ],
		mutationFn: ( variables: V ) =>
			apiFetch< T >( {
				...query,
				data: ( variables ?? undefined ) as unknown as Record< string, unknown >,
			} ),
		onSuccess: ( data, variables, context ) => {
			invalidates.forEach( key => {
				queryClient.invalidateQueries( { queryKey: [ key ] } );
			} );
			options?.onSuccess?.( data, variables, context );
		},
		onError: options?.onError,
	} );
};

export default useSimpleMutation;
