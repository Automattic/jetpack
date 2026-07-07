import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { TextareaControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, InputControl, Stack } from '@wordpress/ui';
import { useCreatePlaylist } from '../../hooks/use-create-playlist';
import { STUDIO_DIALOG_CLASS } from '../studio-dialog';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

/**
 * Dialog for creating a playlist: required name and optional description.
 * Owns the create mutation; on success it notifies and closes, and the
 * playlists query invalidation refreshes the listing behind it.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the dialog is open.
 * @param props.onClose - Called when the dialog should close.
 * @return The dialog element.
 */
export default function CreatePlaylistModal( { isOpen, onClose }: Props ) {
	const [ name, setName ] = useState( '' );
	const [ description, setDescription ] = useState( '' );
	const { mutate: createPlaylist, isPending } = useCreatePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	// Reset the form whenever the dialog opens so a cancelled draft doesn't
	// leak into the next "New playlist".
	useEffect( () => {
		if ( isOpen ) {
			setName( '' );
			setDescription( '' );
		}
	}, [ isOpen ] );

	const canSubmit = name.trim().length > 0 && ! isPending;

	const submit = () => {
		if ( ! canSubmit ) {
			return;
		}
		const trimmedDescription = description.trim();
		createPlaylist(
			{
				name: name.trim(),
				...( trimmedDescription ? { description: trimmedDescription } : {} ),
			},
			{
				onSuccess: () => {
					createSuccessNotice( __( 'Playlist created.', 'jetpack-videopress-pkg' ) );
					onClose();
				},
				onError: () => {
					createErrorNotice( __( 'Failed to create playlist.', 'jetpack-videopress-pkg' ) );
				},
			}
		);
	};

	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup className={ STUDIO_DIALOG_CLASS } size="small">
				<Dialog.Header>
					<Dialog.Title>{ __( 'New playlist', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ /*
				 * Dialog.Popup is an unpadded flex column; body padding comes
				 * from the Dialog.Content region, which also owns scrolling
				 * when the body outgrows the popup.
				 */ }
				<Dialog.Content>
					<Stack direction="column" gap="md">
						<InputControl
							label={ __( 'Name', 'jetpack-videopress-pkg' ) }
							value={ name }
							onValueChange={ next => setName( next ) }
							required
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Description', 'jetpack-videopress-pkg' ) }
							value={ description }
							onChange={ setDescription }
							rows={ 3 }
						/>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" onClick={ onClose } disabled={ isPending }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button onClick={ submit } disabled={ ! canSubmit }>
						{ isPending
							? __( 'Creating…', 'jetpack-videopress-pkg' )
							: __( 'Create playlist', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
