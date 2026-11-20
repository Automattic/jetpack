import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	Button,
	Dialog,
	InputControl,
	RadioGroupControl,
	Stack,
	Text,
	TextareaControl,
} from '@wordpress/ui';
import { useCreatePlaylist } from '../../hooks/use-playlists';
import type { PlaylistItem } from '../../types/playlists';

type Props = {
	onCreated: ( playlist: PlaylistItem ) => void;
	onClose: () => void;
};

/**
 * Ask for a new playlist's title and where it lives, then create it as a draft.
 *
 * @param props           - Component props.
 * @param props.onCreated - Receives the new playlist.
 * @param props.onClose   - Closes the dialog.
 * @return The dialog element.
 */
export default function CreatePlaylistDialog( { onCreated, onClose }: Props ) {
	const [ title, setTitle ] = useState( '' );
	const [ description, setDescription ] = useState( '' );
	const [ postType, setPostType ] = useState< 'page' | 'post' >( 'page' );
	const { mutateAsync: createPlaylist, isPending } = useCreatePlaylist();
	const { createErrorNotice } = useDispatch( noticesStore );

	const submit = async () => {
		try {
			onCreated( await createPlaylist( { title: title.trim(), description, postType } ) );
		} catch ( error ) {
			createErrorNotice(
				( error as { message?: string } )?.message ||
					__( 'The playlist could not be created.', 'jetpack-videopress-pkg' ),
				{ type: 'snackbar' }
			);
		}
	};

	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open && ! isPending ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="medium" className="vp-playlist-create">
				<Dialog.Header>
					<Dialog.Title>{ __( 'New playlist', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIconButton label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<form
						onSubmit={ event => {
							event.preventDefault();
							if ( title.trim() ) {
								void submit();
							}
						} }
					>
						<Stack direction="column" gap="lg">
							<InputControl
								label={ __( 'Title', 'jetpack-videopress-pkg' ) }
								value={ title }
								onValueChange={ setTitle }
								required
							/>
							<TextareaControl
								label={ __( 'Description', 'jetpack-videopress-pkg' ) }
								value={ description }
								onValueChange={ setDescription }
								rows={ 3 }
							/>
							<RadioGroupControl
								label={ __( 'Create it in a new', 'jetpack-videopress-pkg' ) }
								value={ postType }
								items={ [
									{ label: __( 'Page', 'jetpack-videopress-pkg' ), value: 'page' },
									{ label: __( 'Post', 'jetpack-videopress-pkg' ), value: 'post' },
								] }
								onValueChange={ ( value: string ) => setPostType( value as 'page' | 'post' ) }
							/>
							<Text variant="body-sm" className="vp-playlist-create__help">
								{ __(
									'The playlist is saved as a draft. Add videos, then publish it when it’s ready.',
									'jetpack-videopress-pkg'
								) }
							</Text>
							<Stack direction="row" gap="sm" justify="flex-end">
								<Button variant="outline" onClick={ onClose } disabled={ isPending }>
									{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									type="submit"
									loading={ isPending }
									disabled={ isPending || ! title.trim() }
								>
									{ __( 'Create playlist', 'jetpack-videopress-pkg' ) }
								</Button>
							</Stack>
						</Stack>
					</form>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
