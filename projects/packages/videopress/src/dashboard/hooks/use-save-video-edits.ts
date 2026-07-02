import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { EDITS_QUERY_KEY } from './use-video-edits';
import type { ApiEditOperation, SaveEditsResponse } from '../types/edits';

export type SaveVideoEditsVars = {
	guid: string;
	/** The revision the operations were built against (edits.revision). */
	baseRevision: number;
	/** Canonical operations list (see state/serialize.ts sessionToOperations). */
	operations: ApiEditOperation[];
};

/**
 * Typed error thrown when the server rejects a save with 409 `edits_conflict`
 * (the video was edited from elsewhere since `baseRevision`). Callers should
 * catch it with `instanceof` and refetch before letting the user retry.
 */
export class EditsConflictError extends Error {
	/** REST error code, always 'edits_conflict'. */
	code = 'edits_conflict' as const;
	/** The server's current revision, when it was included in the error data. */
	currentRevision: number | null;

	constructor( message?: string, currentRevision: number | null = null ) {
		super( message || 'The video was edited elsewhere; reload the latest revision.' );
		this.name = 'EditsConflictError';
		this.currentRevision = currentRevision;
	}
}

type RestError = {
	code?: string;
	message?: string;
	data?: { current_revision?: number };
};

/**
 * Return a mutation that POSTs an operations list to
 * /wpcom/v2/videopress/{guid}/edits.
 *
 * A 409 `edits_conflict` rejection surfaces as a typed
 * {@link EditsConflictError}. On success the edits query for the guid is
 * invalidated: the refetch picks up the accepted job and keeps polling until
 * it completes, at which point the response carries the new revision — that
 * refetch cycle IS the re-baseline.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts `{ guid, baseRevision, operations }`.
 */
export function useSaveVideoEdits() {
	const client = useQueryClient();
	return useMutation< SaveEditsResponse, Error, SaveVideoEditsVars >( {
		mutationFn: async ( { guid, baseRevision, operations } ) => {
			try {
				return await apiFetch< SaveEditsResponse >( {
					path: `/wpcom/v2/videopress/${ guid }/edits`,
					method: 'POST',
					data: { base_revision: baseRevision, operations },
				} );
			} catch ( error ) {
				const restError = error as RestError;
				if ( restError?.code === 'edits_conflict' ) {
					throw new EditsConflictError(
						restError.message,
						restError.data?.current_revision ?? null
					);
				}
				throw error;
			}
		},
		onSuccess: ( _data, vars ) => {
			client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, vars.guid ] } );
		},
	} );
}
