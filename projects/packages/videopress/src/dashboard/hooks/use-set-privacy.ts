import { useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyStringToInt } from '../utils/library-item';
import { recordVideoPressPrivacyChange } from '../utils/privacy-analytics';
import { postVideoMeta, toVideoMetaSaveError } from '../utils/video-meta-request';
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
					postVideoMeta( { id: Number( id ), privacy_setting: privacySetting } )
				)
			);

			const succeeded: Id[] = [];
			const failed: { id: Id; message: string }[] = [];
			results.forEach( ( result, index ) => {
				const { id, type, from } = videos[ index ];
				if ( result.status === 'fulfilled' ) {
					succeeded.push( id );
					if ( type === 'videopress' ) {
						recordVideoPressPrivacyChange( from, privacy, videos.length > 1 );
					}
					return;
				}
				failed.push( { id, message: toVideoMetaSaveError( result.reason ).message } );
			} );

			return { succeeded, failed };
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
