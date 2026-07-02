import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { SelectControl, TextareaControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, InputControl, Stack } from '@wordpress/ui';
import { useCreatePlaylist } from '../../hooks/use-create-playlist';
import { DEFAULT_PLAYLIST_TYPE } from '../../types/playlist';
import { PLAYLIST_TYPE_LABELS } from './fields';
import type { PlaylistType } from '../../types/playlist';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

const TYPE_OPTIONS = Object.entries( PLAYLIST_TYPE_LABELS ).map( ( [ value, label ] ) => ( {
	value,
	label,
} ) );

/**
 * Dialog for creating a playlist: required name, type select, and optional
 * description. Owns the create mutation; on success it notifies and closes,
 * and the playlists query invalidation refreshes the listing behind it.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the dialog is open.
 * @param props.onClose - Called when the dialog should close.
 * @return The dialog element.
 */
export default function CreatePlaylistModal( { isOpen, onClose }: Props ) {
	const [ name, setName ] = useState( '' );
	const [ type, setType ] = useState< PlaylistType >( DEFAULT_PLAYLIST_TYPE );
	const [ description, setDescription ] = useState( '' );
	const { mutate: createPlaylist, isPending } = useCreatePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	// Reset the form whenever the dialog opens so a cancelled draft doesn't
	// leak into the next "New playlist".
	useEffect( () => {
		if ( isOpen ) {
			setName( '' );
			setType( DEFAULT_PLAYLIST_TYPE );
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
				type,
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
			<Dialog.Popup size="small">
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
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Type', 'jetpack-videopress-pkg' ) }
							value={ type }
							options={ TYPE_OPTIONS }
							onChange={ next => setType( next as PlaylistType ) }
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
