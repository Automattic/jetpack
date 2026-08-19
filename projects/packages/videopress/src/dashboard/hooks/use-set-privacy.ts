import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { privacyStringToInt, LIBRARY_QUERY_KEY } from './use-library';
import type { LibraryItemPrivacy } from '../types/library';

type Id = number | string;

export type SetPrivacyVars = {
	ids: Id[];
	privacy: LibraryItemPrivacy;
};

export type SetPrivacyResult = {
	succeeded: Id[];
	failed: { id: Id; message: string }[];
};

/**
 * Return a mutation that sets the privacy for one or more videos.
 *
 * Each id is POSTed individually to wpcom/v2/videopress/meta with the mapped
 * `privacy_setting` integer (mirroring the single-item meta update). Requests
 * run in parallel (matching useDeleteVideo) and a failure on one video doesn't
 * abort the rest; the result reports which ids succeeded and which failed,
 * letting the caller surface a partial-failure notice. The library cache is
 * invalidated once at the end so the grid reflects whatever did change.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts `{ ids, privacy }`.
 */
export function useSetPrivacy() {
	const client = useQueryClient();
	return useMutation< SetPrivacyResult, Error, SetPrivacyVars >( {
		mutationFn: async ( { ids, privacy } ) => {
			const privacySetting = privacyStringToInt( privacy );
			const results = await Promise.allSettled(
				ids.map( id =>
					apiFetch( {
						path: '/wpcom/v2/videopress/meta',
						method: 'POST',
						data: { id: Number( id ), privacy_setting: privacySetting },
					} )
				)
			);

			const succeeded: Id[] = [];
			const failed: { id: Id; message: string }[] = [];
			results.forEach( ( result, index ) => {
				const id = ids[ index ];
				if ( result.status === 'fulfilled' ) {
					succeeded.push( id );
					return;
				}
				const { reason } = result;
				const message =
					reason instanceof Error
						? reason.message
						: ( reason as { message?: string } )?.message ?? String( reason );
				failed.push( { id, message } );
			} );

			return { succeeded, failed };
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
