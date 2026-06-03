import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_QUERY_KEY } from './use-library';

type Id = number | string;

/**
 * Return a mutation that permanently deletes one or more videos via DELETE /wp/v2/media/{id}?force=true
 * and invalidates the library cache on success.
 *
 * @return A TanStack Query mutation object whose mutateAsync accepts a single id or an array of ids.
 */
export function useDeleteVideo() {
	const client = useQueryClient();
	return useMutation< void, Error, Id | Id[] >( {
		mutationFn: async input => {
			const ids = Array.isArray( input ) ? input : [ input ];
			for ( const id of ids ) {
				await apiFetch( {
					path: `/wp/v2/media/${ id }?force=true`,
					method: 'DELETE',
				} );
			}
		},
		onSuccess: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
