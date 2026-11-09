import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { privacyStringToInt } from '../utils/library-item';
import { recordVideoPressPrivacyChange } from '../utils/privacy-analytics';
import { LIBRARY_QUERY_KEY } from './use-library';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';

type Id = number | string;

export type VideoPrivacyItem = Pick< LibraryItem, 'id' | 'type' | 'privacy' >;

export type SetPrivacyVars = {
	items: VideoPrivacyItem[];
	privacy: LibraryItemPrivacy;
};

export type SetPrivacyResult = {
	succeeded: Id[];
	failed: { id: Id; message: string }[];
};

/**
 * Return a mutation that sets the privacy for one or more videos.
 *
 * Individual requests preserve successful changes when another video fails.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts `{ items, privacy }`.
 */
export function useSetPrivacy() {
	const client = useQueryClient();
	return useMutation< SetPrivacyResult, Error, SetPrivacyVars >( {
		mutationFn: async ( { items, privacy } ) => {
			const videos = Array.from(
				new Map(
					items.map( ( { id, type, privacy: from } ) => [ id, { id, type, from } ] )
				).values()
			);
			const privacySetting = privacyStringToInt( privacy );
			const results = await Promise.allSettled(
				videos.map( ( { id } ) =>
					apiFetch< { code?: string } >( {
						path: '/wpcom/v2/videopress/meta',
						method: 'POST',
						data: { id: Number( id ), privacy_setting: privacySetting },
					} )
				)
			);

			const succeeded: Id[] = [];
			const failed: { id: Id; message: string }[] = [];
			results.forEach( ( result, index ) => {
				const { id, type, from } = videos[ index ];
				if ( result.status === 'fulfilled' ) {
					succeeded.push( id );
					if ( type === 'videopress' && result.value?.code === 'success' ) {
						recordVideoPressPrivacyChange( from, privacy, videos.length > 1 );
					}
					return;
				}
				const { reason } = result;
				const message =
					reason instanceof Error
						? reason.message
						: ( ( reason as { message?: string } )?.message ?? String( reason ) );
				failed.push( { id, message } );
			} );

			return { succeeded, failed };
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
