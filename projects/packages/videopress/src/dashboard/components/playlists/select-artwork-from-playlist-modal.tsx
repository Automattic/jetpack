import { __, sprintf } from '@wordpress/i18n';
import { Dialog, Text } from '@wordpress/ui';
import type { PlaylistVideo } from '../../hooks/use-playlist-videos';

type Props = {
	isOpen: boolean;
	/** The playlist's members, already in display order. */
	videos: PlaylistVideo[];
	onClose: () => void;
	/** Called with the chosen video; closing the dialog is the caller's job. */
	onSelect: ( video: PlaylistVideo ) => void;
};

/**
 * Dialog listing the playlist's videos as a clickable grid of poster
 * thumbnails + titles, used to pick a member video as the playlist artwork.
 * Purely presentational: selection is reported via `onSelect` and the caller
 * owns the artwork mutation, which keeps this trivially testable.
 *
 * @param props          - Component props.
 * @param props.isOpen   - Whether the dialog is open.
 * @param props.videos   - The playlist's members, already in display order.
 * @param props.onClose  - Called when the dialog should close.
 * @param props.onSelect - Receives the chosen video.
 * @return The dialog element.
 */
export default function SelectArtworkFromPlaylistModal( {
	isOpen,
	videos,
	onClose,
	onSelect,
}: Props ) {
	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Select artwork', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ /*
				 * Dialog.Popup is an unpadded flex column; body padding comes
				 * from the Dialog.Content region, which also owns scrolling
				 * when a long playlist outgrows the popup.
				 */ }
				<Dialog.Content>
					{ videos.length === 0 ? (
						// Unreachable through the menu (the entry point is disabled for
						// empty playlists) but kept as a defensive fallback.
						<Text>{ __( 'No videos in this playlist yet.', 'jetpack-videopress-pkg' ) }</Text>
					) : (
						<ul className="vp-playlist__artwork-picker">
							{ videos.map( video => (
								<li key={ video.id } className="vp-playlist__artwork-picker-item">
									<button
										type="button"
										className="vp-playlist__artwork-picker-button"
										onClick={ () => onSelect( video ) }
										aria-label={ sprintf(
											/* translators: %s: video title. */
											__( 'Use the poster of %s as artwork', 'jetpack-videopress-pkg' ),
											video.title
										) }
									>
										<span className="vp-playlist__artwork-picker-thumbnail">
											{ video.thumbnailUrl ? (
												<img
													className="vp-playlist__artwork-picker-image"
													src={ video.thumbnailUrl }
													alt=""
												/>
											) : (
												<span className="vp-playlist__artwork-picker-placeholder" />
											) }
										</span>
										<Text className="vp-playlist__artwork-picker-title">{ video.title }</Text>
									</button>
								</li>
							) ) }
						</ul>
					) }
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
