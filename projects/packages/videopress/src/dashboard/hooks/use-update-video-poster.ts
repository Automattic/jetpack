import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_QUERY_KEY } from './use-library';

export type UpdatePosterVars =
	| { id: string; guid: string; source: 'frame'; atTimeMs: number }
	| { id: string; guid: string; source: 'attachment'; attachmentId: number };

/**
 * Build the POST body for the /poster endpoint from caller-supplied vars.
 *
 * @param vars - Discriminated union describing the poster source and its required fields.
 * @return A plain object ready to pass as the `data` argument to apiFetch.
 */
function buildBody( vars: UpdatePosterVars ) {
	if ( vars.source === 'frame' ) {
		return { at_time: vars.atTimeMs, is_millisec: true };
	}
	return { poster_attachment_id: vars.attachmentId };
}

/**
 * Return a TanStack Query mutation that POSTs a poster update to the
 * /wpcom/v2/videopress/{guid}/poster endpoint and invalidates the library
 * cache on success.
 *
 * @return A TanStack Query UseMutationResult for UpdatePosterVars.
 */
export function useUpdateVideoPoster() {
	const client = useQueryClient();
	return useMutation< unknown, Error, UpdatePosterVars >( {
		mutationFn: async vars => {
			return apiFetch( {
				path: `/wpcom/v2/videopress/${ vars.guid }/poster`,
				method: 'POST',
				data: buildBody( vars ),
			} );
		},
		onSuccess: ( _data, vars ) => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			client.invalidateQueries( {
				queryKey: [ LIBRARY_QUERY_KEY, 'item', String( vars.id ) ],
			} );
		},
	} );
}
