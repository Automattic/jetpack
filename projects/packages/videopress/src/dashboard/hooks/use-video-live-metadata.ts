import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { liveMetadataWithSignedPoster } from '../../client/block-editor/blocks/playlist/use-live-metadata';
import { fetchVideoItem } from '../../client/lib/fetch-video-item';
import type { PlaylistLiveMetadata } from '../../client/block-editor/blocks/playlist/types';

const ONE_HOUR_MS = 1000 * 60 * 60;

/**
 * Read a video's title and poster from the videos API, the same way the
 * Video Playlist block does, so the dashboard shows what visitors see.
 *
 * @param guid - The video GUID.
 * @return Live metadata; empty while loading or when the lookup fails.
 */
export function useVideoLiveMetadata( guid: string | undefined ): PlaylistLiveMetadata {
	const query = useQuery< PlaylistLiveMetadata >( {
		queryKey: [ 'videopress-live-metadata', guid ],
		queryFn: async () => {
			try {
				const item = await fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } );
				return await liveMetadataWithSignedPoster( guid, item as Record< string, unknown > );
			} catch ( error ) {
				if ( ( error as { cause?: { error?: string } } )?.cause?.error === 'auth' ) {
					return {
						title: __( 'Private video', 'jetpack-videopress-pkg' ),
						isPrivateLocked: true,
					};
				}
				return {};
			}
		},
		enabled: Boolean( guid ),
		staleTime: ONE_HOUR_MS,
		retry: false,
	} );

	return query.data ?? {};
}
