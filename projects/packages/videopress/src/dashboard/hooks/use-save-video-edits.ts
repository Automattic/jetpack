import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { EDITS_QUERY_KEY } from './use-video-edits';
import type { ApiEditOperation, SaveEditsResponse, VideoEdits } from '../types/edits';

export type SaveVideoEditsVars = {
	guid: string;
	/** The revision the operations were built against (edits.revision). */
	baseRevision: number;
	/** Canonical operations list (see state/serialize.ts sessionToOperations). */
	operations: ApiEditOperation[];
};

/** A save based on an obsolete revision must be reloaded before retrying. */
export class EditsConflictError extends Error {
	code = 'edits_conflict' as const;
	/** The server's current revision, when it was included in the error data. */
	currentRevision: number | null;

	constructor( message?: string, currentRevision: number | null = null ) {
		super(
			message ||
				__(
					'The video was edited elsewhere; reload the latest revision.',
					'jetpack-videopress-pkg'
				)
		);
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
 * Save edits and immediately expose the accepted processing job to other controls.
 *
 * @return A mutation accepting the GUID, base revision, and operations.
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
		onSuccess: ( data, vars ) => {
			client.setQueryData< VideoEdits >( [ EDITS_QUERY_KEY, vars.guid ], previous =>
				previous ? { ...previous, job: data.job } : previous
			);
			return client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, vars.guid ] } );
		},
	} );
}
