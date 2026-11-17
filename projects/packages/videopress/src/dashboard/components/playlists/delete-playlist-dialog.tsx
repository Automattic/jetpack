import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Stack, Text } from '@wordpress/ui';
import { playlistTitle } from './fields';
import type { PlaylistItem } from '../../types/playlists';

type Props = {
	playlist: PlaylistItem;
	isDeleting?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

/**
 * Confirm deleting a playlist, saying what happens to the post it is in.
 *
 * @param props            - Component props.
 * @param props.playlist   - The playlist.
 * @param props.isDeleting - Whether the delete is in flight.
 * @param props.onCancel   - Closes the dialog.
 * @param props.onConfirm  - Deletes the playlist.
 * @return The dialog element.
 */
export default function DeletePlaylistDialog( {
	playlist,
	isDeleting = false,
	onCancel,
	onConfirm,
}: Props ) {
	const postTitle = playlist.post.title || __( '(no title)', 'jetpack-videopress-pkg' );

	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open && ! isDeleting ) {
					onCancel();
				}
			} }
		>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>
						{ sprintf(
							/* translators: %s: playlist title. */
							__( 'Delete “%s”?', 'jetpack-videopress-pkg' ),
							playlistTitle( playlist )
						) }
					</Dialog.Title>
					<Dialog.CloseIconButton label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<Text>
							{ sprintf(
								/* translators: %s: title of the post or page the playlist is in. */
								__(
									'The playlist is removed from “%s”. If nothing else is left there, it moves to the trash. The videos stay in your library.',
									'jetpack-videopress-pkg'
								),
								postTitle
							) }
						</Text>
						<Stack direction="row" gap="sm" justify="flex-end">
							<Button variant="outline" onClick={ onCancel } disabled={ isDeleting }>
								{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button onClick={ onConfirm } loading={ isDeleting } disabled={ isDeleting }>
								{ __( 'Delete', 'jetpack-videopress-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
