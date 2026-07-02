import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { PLAYLISTS_QUERY_KEY } from '../../hooks/use-playlists';
import { useUpdatePlaylist } from '../../hooks/use-update-playlist';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import type { Playlist } from '../../types/playlist';
import type { MouseEvent } from 'react';

type ApiArtworkAttachment = {
	source_url?: string;
	media_details?: {
		sizes?: Record< string, { source_url?: string } >;
	};
};

/**
 * Resolve a playlist artwork attachment ID to a displayable image URL.
 *
 * The playlists endpoint only stores the attachment ID, so each distinct
 * artwork resolves through one cached /wp/v2/media/{id} lookup (shared
 * across rows and re-renders via the query cache).
 *
 * @param artworkId - The artwork attachment ID, or null when unset.
 * @return The image URL, or null while loading / when unset / on error.
 */
function useArtworkUrl( artworkId: number | null ): string | null {
	const query = useQuery( {
		queryKey: [ PLAYLISTS_QUERY_KEY, 'artwork-url', artworkId ],
		enabled: artworkId !== null,
		staleTime: 5 * 60_000,
		// A missing attachment 404s deterministically (e.g. artwork image
		// deleted from the media library); retrying can't fix that.
		retry: false,
		queryFn: async () => {
			const media = await apiFetch< ApiArtworkAttachment >( {
				path: `/wp/v2/media/${ artworkId }`,
			} );
			return media.media_details?.sizes?.medium?.source_url ?? media.source_url ?? null;
		},
	} );
	return query.data ?? null;
}

/**
 * Render the media-area for one playlist row/card: the artwork image (or a
 * placeholder) plus a hover-revealed action that opens the WordPress media
 * library to set or change the artwork. Mirrors the library thumbnail's
 * hover-action overlay pattern.
 *
 * @param props      - Component props.
 * @param props.item - The playlist rendered by this cell.
 * @return The artwork element.
 */
export default function ArtworkField( { item }: { item: Playlist } ) {
	const artworkUrl = useArtworkUrl( item.artworkId );
	const { mutate: updatePlaylist } = useUpdatePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	// wp.media ships with the classic-editor media scripts; without it the
	// picker can't open, so the action is hidden rather than left to throw.
	const canSelectArtwork = Boolean( ( window.wp as WpGlobal | undefined )?.media );

	const handleSelectArtwork = async ( event: MouseEvent< HTMLButtonElement > ) => {
		// The whole media cell doubles as the row-navigation target (DataViews'
		// onClickItem); keep the artwork action from also opening the playlist.
		event.stopPropagation();
		const attachment = await selectImageFromMediaLibrary( {
			title: __( 'Select artwork', 'jetpack-videopress-pkg' ),
			buttonText: __( 'Use this image as artwork', 'jetpack-videopress-pkg' ),
		} ).catch( () => null );
		if ( ! attachment ) {
			return;
		}
		updatePlaylist(
			{ id: item.id, patch: { artworkId: attachment.id } },
			{
				onSuccess: () => {
					createSuccessNotice( __( 'Playlist artwork updated.', 'jetpack-videopress-pkg' ) );
				},
				onError: () => {
					createErrorNotice( __( 'Failed to update playlist artwork.', 'jetpack-videopress-pkg' ) );
				},
			}
		);
	};

	return (
		<div className="vp-playlists__artwork">
			{ artworkUrl ? (
				<img className="vp-playlists__artwork-image" src={ artworkUrl } alt={ item.name } />
			) : (
				<Stack
					direction="column"
					align="center"
					justify="center"
					className="vp-playlists__artwork-placeholder"
				>
					<Text>{ __( 'No artwork', 'jetpack-videopress-pkg' ) }</Text>
				</Stack>
			) }

			{ canSelectArtwork ? (
				<Stack
					direction="row"
					align="center"
					justify="center"
					className="vp-playlists__hover-action"
				>
					<button
						type="button"
						className="vp-playlists__hover-action-button"
						onClick={ handleSelectArtwork }
						aria-label={ sprintf(
							/* translators: %s: playlist name. */
							__( 'Change artwork for %s', 'jetpack-videopress-pkg' ),
							item.name
						) }
					>
						{ item.artworkId
							? __( 'Change artwork', 'jetpack-videopress-pkg' )
							: __( 'Set artwork', 'jetpack-videopress-pkg' ) }
					</button>
				</Stack>
			) : null }
		</div>
	);
}
