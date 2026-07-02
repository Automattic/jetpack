import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { cloud, media, pencil } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { usePlaylistArtwork } from '../../hooks/use-playlist-artwork';
import { useUpdatePlaylist } from '../../hooks/use-update-playlist';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import SelectArtworkFromPlaylistModal from './select-artwork-from-playlist-modal';
import type { PlaylistVideo } from '../../hooks/use-playlist-videos';
import type { Playlist } from '../../types/playlist';
import type { MouseEvent } from 'react';

/**
 * The artwork image, or the "No artwork" placeholder when no URL resolved.
 * Shared by the list cell and the detail-screen control so both render the
 * same visuals (vp-playlists__artwork-* class names).
 *
 * @param props      - Component props.
 * @param props.url  - The resolved artwork URL, or null.
 * @param props.name - The playlist name, used as the image alt text.
 * @return The image or placeholder element.
 */
const ArtworkImage = ( { url, name }: { url: string | null; name: string } ) =>
	url ? (
		<img className="vp-playlists__artwork-image" src={ url } alt={ name } />
	) : (
		<Stack
			direction="column"
			align="center"
			justify="center"
			className="vp-playlists__artwork-placeholder"
		>
			<Text>{ __( 'No artwork', 'jetpack-videopress-pkg' ) }</Text>
		</Stack>
	);

/**
 * Return a callback that persists a new artwork attachment ID for the given
 * playlist, with the standard success/error notices. Shared by the list
 * cell's media-library action and the detail screen's update menu.
 *
 * @param playlistId - The playlist term ID to update.
 * @return A function taking the new artwork attachment ID.
 */
function useSetArtwork( playlistId: number ): ( artworkId: number ) => void {
	const { mutate: updatePlaylist } = useUpdatePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	return ( artworkId: number ) => {
		updatePlaylist(
			{ id: playlistId, patch: { artworkId } },
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
}

/**
 * Open the WordPress media library with the artwork copy and resolve with the
 * chosen image's attachment ID, or null when dismissed / unavailable.
 *
 * @return The selected attachment ID, or null.
 */
async function pickArtworkImage(): Promise< number | null > {
	const attachment = await selectImageFromMediaLibrary( {
		title: __( 'Select artwork', 'jetpack-videopress-pkg' ),
		buttonText: __( 'Use this image as artwork', 'jetpack-videopress-pkg' ),
	} ).catch( () => null );
	return attachment ? attachment.id : null;
}

/**
 * Render the media-area for one playlist row/card: the artwork image (or a
 * placeholder) plus a hover-revealed action that opens the WordPress media
 * library to set or change the artwork. Mirrors the library thumbnail's
 * hover-action overlay pattern. When no artwork is set, the first ordered
 * video's poster stands in (resolved by usePlaylistArtwork via one batched
 * media lookup per page of rows).
 *
 * @param props      - Component props.
 * @param props.item - The playlist rendered by this cell.
 * @return The artwork element.
 */
export default function ArtworkField( { item }: { item: Playlist } ) {
	const { url: artworkUrl } = usePlaylistArtwork( item );
	const setArtwork = useSetArtwork( item.id );

	// wp.media ships with the classic-editor media scripts; without it the
	// picker can't open, so the action is hidden rather than left to throw.
	const canSelectArtwork = Boolean( ( window.wp as WpGlobal | undefined )?.media );

	const handleSelectArtwork = async ( event: MouseEvent< HTMLButtonElement > ) => {
		// The whole media cell doubles as the row-navigation target (DataViews'
		// onClickItem); keep the artwork action from also opening the playlist.
		event.stopPropagation();
		const attachmentId = await pickArtworkImage();
		if ( attachmentId !== null ) {
			setArtwork( attachmentId );
		}
	};

	return (
		<div className="vp-playlists__artwork">
			<ArtworkImage url={ artworkUrl } name={ item.name } />

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

type PlaylistDetailArtworkProps = {
	playlist: Playlist;
	/** The playlist's members in display order; the first is the artwork fallback. */
	videos: PlaylistVideo[];
	/**
	 * Whether the members fetch is still in flight. While true, `videos` is
	 * `[]`, so the unset-artwork fallback resolves via `order[0]` (usually
	 * already cached from the list screen) instead of flashing the placeholder.
	 */
	videosLoading?: boolean;
};

/**
 * The playlist detail screen's artwork control: the artwork image with a
 * small edit menu overlaid on its top-right corner, mirroring the video
 * details screen's thumbnail-update pattern. The menu offers exactly two
 * actions — "Select from playlist" (a dialog of the playlist's videos whose
 * chosen video's attachment ID becomes the artwork) and "Upload image" (the
 * WordPress media library).
 *
 * @param props               - Component props.
 * @param props.playlist      - The playlist being edited.
 * @param props.videos        - The playlist's members in display order.
 * @param props.videosLoading - Whether the members fetch is still in flight.
 * @return The artwork control element.
 */
export function PlaylistDetailArtwork( {
	playlist,
	videos,
	videosLoading = false,
}: PlaylistDetailArtworkProps ) {
	// Once the members are loaded the unset-artwork fallback is the first
	// ordered video's poster — no extra media lookup. While they're still in
	// flight, `videos` is `[]`; passing undefined lets the hook resolve the
	// fallback itself from `order[0]` (typically already cached from the list
	// screen) rather than flashing the "No artwork" placeholder.
	const { url } = usePlaylistArtwork( playlist, {
		firstVideoPoster: videosLoading ? undefined : videos[ 0 ]?.thumbnailUrl ?? null,
	} );
	const setArtwork = useSetArtwork( playlist.id );
	const [ isSelectOpen, setSelectOpen ] = useState( false );

	// Same guard as the list cell: without wp.media the picker can't open.
	const canUploadImage = Boolean( ( window.wp as WpGlobal | undefined )?.media );

	const handleUploadImage = async () => {
		const attachmentId = await pickArtworkImage();
		if ( attachmentId !== null ) {
			setArtwork( attachmentId );
		}
	};

	return (
		<div className="vp-playlists__artwork">
			<ArtworkImage url={ url } name={ playlist.name } />
			<DropdownMenu
				icon={ pencil }
				label={ __( 'Update artwork', 'jetpack-videopress-pkg' ) }
				className="vp-playlist__artwork-update"
				toggleProps={ { size: 'compact' } }
			>
				{ ( { onClose } ) => (
					<MenuGroup>
						<MenuItem
							icon={ media }
							disabled={ videosLoading || videos.length === 0 }
							onClick={ () => {
								setSelectOpen( true );
								onClose();
							} }
						>
							{ __( 'Select from playlist', 'jetpack-videopress-pkg' ) }
						</MenuItem>
						<MenuItem
							icon={ cloud }
							disabled={ ! canUploadImage }
							onClick={ () => {
								handleUploadImage();
								onClose();
							} }
						>
							{ __( 'Upload image', 'jetpack-videopress-pkg' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
			<SelectArtworkFromPlaylistModal
				isOpen={ isSelectOpen }
				videos={ videos }
				onClose={ () => setSelectOpen( false ) }
				onSelect={ video => {
					setSelectOpen( false );
					setArtwork( video.id );
				} }
			/>
		</div>
	);
}
