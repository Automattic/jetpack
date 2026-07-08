import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_ITEM_QUERY_SEGMENT, LIBRARY_QUERY_KEY } from './use-library';
import type { LibraryItem } from '../types/library';

export type UpdatePosterVars =
	| { id: string; guid: string; source: 'frame'; atTimeMs: number }
	| { id: string; guid: string; source: 'attachment'; attachmentId: number };

/** Milliseconds between each poll of the poster-generation status endpoint. */
export const POSTER_POLL_INTERVAL_MS = 2000;

/** Maximum number of GET polls before giving up on poster generation. */
export const POSTER_POLL_MAX_ATTEMPTS = 30;

const sleep = ( ms: number ) => new Promise( resolve => setTimeout( resolve, ms ) );

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

type PosterApiResponse = {
	data?: {
		generating?: boolean;
		poster?: string;
	};
};

/**
 * POST the poster update, then poll until server-side generation completes,
 * and persist the final poster URL to the video meta.
 *
 * @param vars - The mutation variables (guid, id, and poster source details).
 * @return An object containing the final poster URL, or undefined if generation did not complete.
 */
async function mutationFn( vars: UpdatePosterVars ): Promise< { poster?: string } > {
	const postResp = ( await apiFetch( {
		path: `/wpcom/v2/videopress/${ vars.guid }/poster`,
		method: 'POST',
		data: buildBody( vars ),
	} ) ) as PosterApiResponse;

	let generating = postResp?.data?.generating;
	let poster = postResp?.data?.poster;

	if ( generating ) {
		for ( let attempt = 0; attempt < POSTER_POLL_MAX_ATTEMPTS; attempt++ ) {
			await sleep( POSTER_POLL_INTERVAL_MS );
			const pollResp = ( await apiFetch( {
				path: `/wpcom/v2/videopress/${ vars.guid }/poster`,
				method: 'GET',
			} ) ) as PosterApiResponse;
			generating = pollResp?.data?.generating;
			poster = pollResp?.data?.poster;
			if ( ! generating ) {
				break;
			}
		}
	}

	if ( poster ) {
		await apiFetch( {
			path: '/wpcom/v2/videopress/meta',
			method: 'POST',
			data: { id: Number( vars.id ), poster },
		} );
	}

	return { poster };
}

/**
 * Return a TanStack Query mutation that POSTs a poster update, polls until
 * server-side generation completes, persists the final URL to video meta, and
 * updates the cached item directly so the UI reflects the new poster without
 * an extra refetch.
 *
 * @return A TanStack Query UseMutationResult for UpdatePosterVars.
 */
export function useUpdateVideoPoster() {
	const client = useQueryClient();
	return useMutation< { poster?: string }, Error, UpdatePosterVars >( {
		mutationFn,
		onSuccess: ( { poster }, vars ) => {
			if ( poster ) {
				client.setQueryData(
					[ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( vars.id ) ],
					( old: LibraryItem | undefined ) => ( old ? { ...old, thumbnailUrl: poster } : old )
				);
			}
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
