import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { useDeletePlaylist } from '../../hooks/use-delete-playlist';
import type { Playlist } from '../../types/playlist';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Confirmation dialog body for the playlists Delete action. Rendered by
 * DataViews inside its own modal chrome (title comes from the action's
 * `modalHeader`). Owns the delete mutation so actions.ts stays a plain
 * declarative list.
 *
 * @param props                   - RenderModal props injected by DataViews.
 * @param props.items             - The playlists selected for deletion.
 * @param props.closeModal        - Closes the modal.
 * @param props.onActionPerformed - Notifies DataViews the action completed.
 * @return The modal body element.
 */
export default function DeletePlaylistModal( {
	items,
	closeModal,
	onActionPerformed,
}: RenderModalProps< Playlist > ) {
	const { mutateAsync: deletePlaylists, isPending } = useDeletePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const onConfirm = async () => {
		try {
			const { succeeded, failed } = await deletePlaylists( items.map( item => item.id ) );
			if ( failed.length === 0 ) {
				createSuccessNotice(
					sprintf(
						/* translators: %d: number of deleted playlists. */
						_n(
							'%d playlist deleted.',
							'%d playlists deleted.',
							succeeded.length,
							'jetpack-videopress-pkg'
						),
						succeeded.length
					)
				);
				onActionPerformed?.( items );
			} else if ( succeeded.length === 0 ) {
				createErrorNotice(
					_n(
						'Failed to delete playlist.',
						'Failed to delete the selected playlists.',
						failed.length,
						'jetpack-videopress-pkg'
					)
				);
			} else {
				createErrorNotice(
					sprintf(
						/* translators: 1: number of deleted playlists. 2: number of playlists that could not be deleted. */
						_n(
							'%1$d playlist deleted; %2$d could not be deleted.',
							'%1$d playlists deleted; %2$d could not be deleted.',
							succeeded.length,
							'jetpack-videopress-pkg'
						),
						succeeded.length,
						failed.length
					)
				);
				onActionPerformed?.( items );
			}
		} catch {
			createErrorNotice( __( 'Failed to delete playlist.', 'jetpack-videopress-pkg' ) );
		}
		closeModal?.();
	};

	return (
		<Stack direction="column" gap="lg">
			<Text>
				{ items.length === 1
					? sprintf(
							/* translators: %s: playlist name. */
							__(
								'Delete "%s"? Videos in this playlist will not be deleted.',
								'jetpack-videopress-pkg'
							),
							items[ 0 ].name
					  )
					: sprintf(
							/* translators: %d: number of playlists to delete. */
							_n(
								'Delete %d playlist? Videos in this playlist will not be deleted.',
								'Delete %d playlists? Videos in these playlists will not be deleted.',
								items.length,
								'jetpack-videopress-pkg'
							),
							items.length
					  ) }
			</Text>
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="outline" onClick={ () => closeModal?.() } disabled={ isPending }>
					{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button onClick={ onConfirm } disabled={ isPending }>
					{ isPending
						? __( 'Deleting…', 'jetpack-videopress-pkg' )
						: __( 'Delete', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
