import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { CheckboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, InputControl, Stack, Text } from '@wordpress/ui';
import { useCreatePlaylist } from '../../hooks/use-create-playlist';
import { usePlaylists } from '../../hooks/use-playlists';
import { useSetPlaylists } from '../../hooks/use-set-playlists';
import type { LibraryItem } from '../../types/library';
import type { Playlist } from '../../types/playlist';

// Structurally identical to DataViews' `RenderModalProps< LibraryItem >` —
// the assignment to `RenderModal` in actions.ts keeps that compatibility
// checked at compile time — but owned locally so the component can also be
// driven directly (the video details screen renders it inside its own
// Dialog chrome with a single-item array).
export type AddToPlaylistModalProps = {
	/** The videos to add to the chosen playlists. */
	items: LibraryItem[];
	/** Closes the hosting modal/dialog; invoked on Cancel and after confirm. */
	closeModal?: () => void;
	/** Notifies the host that memberships changed (DataViews clears its selection). */
	onActionPerformed?: ( items: LibraryItem[] ) => void;
};

/**
 * Modal body for the "Add to playlist" action. Rendered by DataViews inside
 * its own modal chrome for the library bulk action (title comes from the
 * action's `modalHeader`), and directly by the video details screen inside a
 * `Dialog` for the single current video. Offers a checkbox per playlist plus
 * an inline create-new-playlist input; owns the membership mutation (and its
 * success/error notices) so hosts stay declarative.
 *
 * @param props                   - Component props (see AddToPlaylistModalProps).
 * @param props.items             - The videos to add to the chosen playlists.
 * @param props.closeModal        - Closes the hosting modal/dialog.
 * @param props.onActionPerformed - Notifies the host the action completed.
 * @return The modal body element.
 */
export default function AddToPlaylistModal( {
	items,
	closeModal,
	onActionPerformed,
}: AddToPlaylistModalProps ) {
	const { playlists, isLoading } = usePlaylists();
	const { mutateAsync: setPlaylists, isPending } = useSetPlaylists();
	const { mutate: createPlaylist, isPending: isCreating } = useCreatePlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const [ selectedIds, setSelectedIds ] = useState< number[] >( [] );
	const [ newName, setNewName ] = useState( '' );
	// Playlists created from this modal. The create mutation invalidates the
	// playlists cache, but until that refetch lands the new playlist isn't in
	// `playlists` yet — track it locally so it renders (checked) immediately
	// and is still resolvable when the user confirms.
	const [ created, setCreated ] = useState< Playlist[] >( [] );

	const fetchedIds = new Set( playlists.map( playlist => playlist.id ) );
	const allPlaylists = [
		...playlists,
		...created.filter( playlist => ! fetchedIds.has( playlist.id ) ),
	];

	const toggle = ( id: number, checked: boolean ) => {
		setSelectedIds( prev => ( checked ? [ ...prev, id ] : prev.filter( s => s !== id ) ) );
	};

	const onCreate = () => {
		const name = newName.trim();
		if ( ! name || isCreating ) {
			return;
		}
		createPlaylist(
			{ name },
			{
				onSuccess: playlist => {
					// Pre-select the new playlist so creating it is one step
					// of "add to it".
					setCreated( prev => [ ...prev, playlist ] );
					setSelectedIds( prev => [ ...prev, playlist.id ] );
					setNewName( '' );
				},
				onError: () => {
					createErrorNotice( __( 'Failed to create playlist.', 'jetpack-videopress-pkg' ) );
				},
			}
		);
	};

	const onConfirm = async () => {
		const chosen = allPlaylists.filter( playlist => selectedIds.includes( playlist.id ) );
		if ( chosen.length === 0 || isPending ) {
			return;
		}
		try {
			const { succeeded, failed } = await setPlaylists( { items, playlists: chosen } );
			if ( failed.length === 0 ) {
				createSuccessNotice(
					chosen.length === 1
						? sprintf(
								/* translators: 1: number of videos added. 2: playlist name. */
								_n(
									'%1$d video added to "%2$s".',
									'%1$d videos added to "%2$s".',
									succeeded.length,
									'jetpack-videopress-pkg'
								),
								succeeded.length,
								chosen[ 0 ].name
						  )
						: sprintf(
								/* translators: 1: number of videos added. 2: number of playlists they were added to. */
								_n(
									'%1$d video added to %2$d playlists.',
									'%1$d videos added to %2$d playlists.',
									succeeded.length,
									'jetpack-videopress-pkg'
								),
								succeeded.length,
								chosen.length
						  )
				);
				onActionPerformed?.( items );
			} else if ( succeeded.length === 0 ) {
				createErrorNotice(
					_n(
						'Failed to add the video to playlists.',
						'Failed to add the selected videos to playlists.',
						failed.length,
						'jetpack-videopress-pkg'
					)
				);
			} else {
				createErrorNotice(
					sprintf(
						/* translators: 1: number of videos added. 2: number of videos that could not be added. */
						_n(
							'%1$d video added to playlists; %2$d could not be added.',
							'%1$d videos added to playlists; %2$d could not be added.',
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
			createErrorNotice(
				__( 'Failed to add the selected videos to playlists.', 'jetpack-videopress-pkg' )
			);
		}
		closeModal?.();
	};

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="column" gap="sm">
				{ isLoading && <Text>{ __( 'Loading playlists…', 'jetpack-videopress-pkg' ) }</Text> }
				{ ! isLoading && allPlaylists.length === 0 && (
					<Text>{ __( 'No playlists yet. Create one below.', 'jetpack-videopress-pkg' ) }</Text>
				) }
				{ allPlaylists.map( playlist => (
					<CheckboxControl
						key={ playlist.id }
						__nextHasNoMarginBottom
						label={ playlist.name }
						checked={ selectedIds.includes( playlist.id ) }
						onChange={ checked => toggle( playlist.id, checked ) }
					/>
				) ) }
			</Stack>
			<Stack direction="row" gap="sm" align="end">
				<InputControl
					label={ __( 'New playlist', 'jetpack-videopress-pkg' ) }
					value={ newName }
					onValueChange={ next => setNewName( next ) }
				/>
				<Button
					variant="outline"
					onClick={ onCreate }
					disabled={ newName.trim().length === 0 || isCreating }
				>
					{ isCreating
						? __( 'Creating…', 'jetpack-videopress-pkg' )
						: __( 'Create', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="outline" onClick={ () => closeModal?.() } disabled={ isPending }>
					{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button onClick={ onConfirm } disabled={ selectedIds.length === 0 || isPending }>
					{ isPending
						? __( 'Adding…', 'jetpack-videopress-pkg' )
						: __( 'Add', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
