import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Link, useNavigate, useParams } from '@wordpress/route';
import {
	Button,
	ButtonLink,
	Card,
	InputControl,
	Notice,
	Stack,
	SwitchControl,
	Text,
	TextareaControl,
} from '@wordpress/ui';
import {
	entryFromApiResponse,
	guidFromInput,
} from '../../src/client/block-editor/blocks/playlist/entries';
import { fetchVideoItem } from '../../src/client/lib/fetch-video-item';
import AddVideosDialog from '../../src/dashboard/components/playlists/add-videos-dialog';
import DeletePlaylistDialog from '../../src/dashboard/components/playlists/delete-playlist-dialog';
import {
	PlaylistStatusBadge,
	playlistTitle,
	videoCountLabel,
} from '../../src/dashboard/components/playlists/fields';
import PlaylistPreviewCard from '../../src/dashboard/components/playlists/playlist-preview-card';
import PlaylistVideos from '../../src/dashboard/components/playlists/playlist-videos';
import {
	AppearanceCard,
	EntryDisplayCard,
	PlaybackCard,
} from '../../src/dashboard/components/playlists/settings-cards';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useAdminShellLeaveGuard } from '../../src/dashboard/hooks/use-admin-shell-leave-guard';
import {
	useDeletePlaylist,
	usePlaylist,
	useUpdatePlaylist,
} from '../../src/dashboard/hooks/use-playlists';
import { formatDuration } from '../../src/dashboard/utils/format';
import './style.scss';
import type { LibraryItem } from '../../src/dashboard/types/library';
import type {
	PlaylistEntry,
	PlaylistItem,
	PlaylistSettings,
} from '../../src/dashboard/types/playlists';
import type { ReactNode } from 'react';

type FormValues = Pick< PlaylistItem, 'title' | 'description' | 'videos' | 'settings' >;

const PARENT_BREADCRUMBS = [
	{ label: 'VideoPress', to: '/' },
	{ label: __( 'Playlists', 'jetpack-videopress-pkg' ), to: '/playlists' },
];

const Shell = ( { label, children }: { label: string; children: ReactNode } ) => (
	<AdminPage breadcrumbs={ <Breadcrumbs items={ [ ...PARENT_BREADCRUMBS, { label } ] } /> }>
		<div className="vp-playlist-editor">{ children }</div>
	</AdminPage>
);

/**
 * Resolve a video to a playlist entry with its exact duration and height,
 * falling back to what the library knows when the videos API can't be read.
 *
 * @param guid     - The video GUID.
 * @param fallback - Entry to use when the lookup fails; omit to rethrow.
 * @return The entry.
 */
async function resolveEntry( guid: string, fallback?: PlaylistEntry ): Promise< PlaylistEntry > {
	try {
		const item = await fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } );
		return entryFromApiResponse( guid, item as Record< string, unknown > );
	} catch ( error ) {
		if ( fallback ) {
			return fallback;
		}
		throw error;
	}
}

/**
 * Whether two playlists hold the same values.
 *
 * @param a - First playlist.
 * @param b - Second playlist.
 * @return True when nothing differs.
 */
const sameValues = ( a: FormValues, b: FormValues ): boolean =>
	a.title === b.title &&
	a.description === b.description &&
	JSON.stringify( a.videos ) === JSON.stringify( b.videos ) &&
	JSON.stringify( a.settings ) === JSON.stringify( b.settings );

/**
 * The form values a saved playlist starts from.
 *
 * @param playlist - The playlist.
 * @return Form values.
 */
const valuesOf = ( playlist: PlaylistItem ): FormValues => ( {
	title: playlist.title,
	description: playlist.description,
	videos: playlist.videos,
	settings: playlist.settings,
} );

const Editor = ( { playlist }: { playlist: PlaylistItem } ) => {
	const saved = valuesOf( playlist );
	const [ values, setValues ] = useState< FormValues >( saved );
	const [ isDeleteOpen, setDeleteOpen ] = useState( false );
	const navigate = useNavigate();
	const { mutateAsync: deletePlaylist, isPending: isDeleting } = useDeletePlaylist();
	// Latest values for adds that resolve after an await.
	const valuesRef = useRef( values );
	valuesRef.current = values;
	const [ isPickerOpen, setPickerOpen ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( '' );
	const [ isAdding, setIsAdding ] = useState( false );
	const [ addError, setAddError ] = useState< string | null >( null );
	const { mutateAsync: updatePlaylist, isPending: isSaving } = useUpdatePlaylist();
	const { createSuccessNotice, createErrorNotice, createInfoNotice } = useDispatch( noticesStore );

	const isDirty = ! sameValues( values, saved );
	const readOnly = ! playlist.canEdit;
	const runtimeMs = values.videos.reduce( ( sum, entry ) => sum + ( entry.durationMs ?? 0 ), 0 );

	useEffect( () => {
		if ( ! isDirty ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ isDirty ] );

	const update = useCallback(
		( patch: Partial< FormValues > ) => setValues( current => ( { ...current, ...patch } ) ),
		[]
	);
	const updateSettings = useCallback(
		( patch: Partial< PlaylistSettings > ) =>
			setValues( current => ( { ...current, settings: { ...current.settings, ...patch } } ) ),
		[]
	);

	const appendEntries = useCallback(
		( entries: PlaylistEntry[] ) => {
			const existing = new Set( valuesRef.current.videos.map( entry => entry.guid ) );
			const fresh = entries.filter( entry => ! existing.has( entry.guid ) );
			const skipped = entries.length - fresh.length;
			if ( skipped > 0 ) {
				createInfoNotice(
					sprintf(
						/* translators: %d: number of videos skipped. */
						_n(
							'%d video is already in this playlist and was skipped.',
							'%d videos are already in this playlist and were skipped.',
							skipped,
							'jetpack-videopress-pkg'
						),
						skipped
					),
					{ type: 'snackbar' }
				);
			}
			if ( fresh.length ) {
				setValues( current => ( { ...current, videos: [ ...current.videos, ...fresh ] } ) );
			}
		},
		[ createInfoNotice ]
	);

	const addFromLibrary = useCallback(
		async ( items: LibraryItem[] ) => {
			setPickerOpen( false );
			setIsAdding( true );
			const entries = await Promise.all(
				items.map( item =>
					resolveEntry( item.guid, {
						guid: item.guid,
						...( item.durationSeconds > 0 && { durationMs: item.durationSeconds * 1000 } ),
					} )
				)
			);
			appendEntries( entries );
			setIsAdding( false );
		},
		[ appendEntries ]
	);

	const addFromInput = async () => {
		const guid = guidFromInput( urlInput );
		if ( ! guid ) {
			setAddError( __( 'Paste a VideoPress video URL or GUID.', 'jetpack-videopress-pkg' ) );
			return;
		}
		setIsAdding( true );
		setAddError( null );
		try {
			appendEntries( [ await resolveEntry( guid ) ] );
			setUrlInput( '' );
		} catch {
			setAddError( __( 'No video found at that link.', 'jetpack-videopress-pkg' ) );
		} finally {
			setIsAdding( false );
		}
	};

	const save = async ( status?: 'publish' | 'draft' ) => {
		try {
			const result = await updatePlaylist( {
				key: playlist.key,
				patch: { ...values, ...( status && { status } ) },
			} );
			setValues( valuesOf( result ) );
			let message: string = __( 'Playlist saved.', 'jetpack-videopress-pkg' );
			if ( status === 'publish' ) {
				message = __( 'Playlist published.', 'jetpack-videopress-pkg' );
			} else if ( status === 'draft' ) {
				message = __( 'Playlist switched to draft.', 'jetpack-videopress-pkg' );
			}
			createSuccessNotice( message, { type: 'snackbar' } );
			// A status change can re-key the playlist; follow it.
			if ( result.key !== playlist.key ) {
				navigate( { href: `/playlists/${ result.key }`, replace: true } );
			}
		} catch ( error ) {
			createErrorNotice(
				( error as { message?: string } )?.message ||
					__( 'The playlist could not be saved.', 'jetpack-videopress-pkg' ),
				{ type: 'snackbar' }
			);
		}
	};

	const confirmDelete = async () => {
		try {
			await deletePlaylist( playlist.key );
			createSuccessNotice( __( 'Playlist deleted.', 'jetpack-videopress-pkg' ), {
				type: 'snackbar',
			} );
			setDeleteOpen( false );
			navigate( { href: '/playlists' } );
		} catch ( error ) {
			createErrorNotice(
				( error as { message?: string } )?.message ||
					__( 'The playlist could not be deleted.', 'jetpack-videopress-pkg' ),
				{ type: 'snackbar' }
			);
		}
	};

	const isPublished = playlist.status === 'publish';
	const canChangeStatus = ! readOnly && playlist.canPublish;
	const viewLabel = isPublished
		? __( 'View', 'jetpack-videopress-pkg' )
		: __( 'Preview', 'jetpack-videopress-pkg' );

	const confirmLeave = () =>
		! isDirty ||
		// eslint-disable-next-line no-alert -- Navigation must synchronously confirm before leaving the form.
		window.confirm(
			__( 'You have unsaved changes. Leave this page and discard them?', 'jetpack-videopress-pkg' )
		);
	useAdminShellLeaveGuard( () => isDirty );

	return (
		<AdminPage
			breadcrumbs={
				<div
					onClickCapture={ event => {
						if ( ( event.target as HTMLElement ).closest( 'a' ) && ! confirmLeave() ) {
							event.preventDefault();
							event.stopPropagation();
						}
					} }
				>
					<Breadcrumbs items={ [ ...PARENT_BREADCRUMBS, { label: playlistTitle( values ) } ] } />
				</div>
			}
			actions={
				<Stack direction="row" gap="sm" align="center">
					<PlaylistStatusBadge item={ playlist } />
					{ playlist.url && (
						<ButtonLink size="compact" variant="outline" href={ playlist.url } openInNewTab>
							{ viewLabel }
						</ButtonLink>
					) }
					{ canChangeStatus && isPublished && (
						<Button
							size="compact"
							variant="outline"
							disabled={ isSaving }
							onClick={ () => void save( 'draft' ) }
						>
							{ __( 'Switch to draft', 'jetpack-videopress-pkg' ) }
						</Button>
					) }
					<Button
						size="compact"
						variant={ canChangeStatus && ! isPublished ? 'outline' : 'solid' }
						disabled={ readOnly || ! isDirty || isSaving }
						loading={ isSaving }
						onClick={ () => void save() }
					>
						{ isPublished
							? __( 'Save', 'jetpack-videopress-pkg' )
							: __( 'Save draft', 'jetpack-videopress-pkg' ) }
					</Button>
					{ canChangeStatus && ! isPublished && (
						<Button size="compact" disabled={ isSaving } onClick={ () => void save( 'publish' ) }>
							{ __( 'Publish', 'jetpack-videopress-pkg' ) }
						</Button>
					) }
				</Stack>
			}
		>
			<div className="vp-playlist-editor">
				{ readOnly && (
					<Notice.Root intent="info" className="vp-playlist-editor__notice">
						<Notice.Description>
							{ __(
								'You can’t edit the post this playlist is in, so it is read-only.',
								'jetpack-videopress-pkg'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				<div className="vp-playlist-editor__layout">
					<div className="vp-playlist-editor__main">
						<PlaylistPreviewCard
							title={ values.title }
							videos={ values.videos }
							settings={ values.settings }
						/>
						<Card.Root className="vp-playlist-editor__videos">
							<Card.Header>
								<Stack direction="row" justify="space-between" align="center" gap="sm">
									<Stack direction="column" gap="xs">
										<Card.Title>{ __( 'Videos', 'jetpack-videopress-pkg' ) }</Card.Title>
										<Text variant="body-sm" className="vp-playlist-editor__summary">
											{ [
												videoCountLabel( values.videos.length ),
												runtimeMs ? formatDuration( runtimeMs / 1000 ) : '',
											]
												.filter( Boolean )
												.join( ' · ' ) }
										</Text>
									</Stack>
									<Button
										size="compact"
										variant="outline"
										disabled={ readOnly || isAdding }
										onClick={ () => setPickerOpen( true ) }
									>
										{ __( 'Add videos', 'jetpack-videopress-pkg' ) }
									</Button>
								</Stack>
							</Card.Header>
							<Card.Content>
								<Stack direction="column" gap="md">
									{ values.videos.length > 0 ? (
										<PlaylistVideos
											videos={ values.videos }
											onChange={ videos => ! readOnly && update( { videos } ) }
										/>
									) : (
										<Text className="vp-playlist-editor__empty">
											{ __(
												'This playlist has no videos. Add some from your library.',
												'jetpack-videopress-pkg'
											) }
										</Text>
									) }
									{ ! readOnly && (
										<form
											className="vp-playlist-editor__add-url"
											onSubmit={ event => {
												event.preventDefault();
												void addFromInput();
											} }
										>
											<InputControl
												label={ __( 'Add by link', 'jetpack-videopress-pkg' ) }
												placeholder={ __(
													'Paste a VideoPress video URL or GUID',
													'jetpack-videopress-pkg'
												) }
												value={ urlInput }
												onValueChange={ next => {
													setUrlInput( next );
													setAddError( null );
												} }
											/>
											<Button
												type="submit"
												size="compact"
												variant="outline"
												disabled={ isAdding || ! urlInput.trim() }
												loading={ isAdding }
											>
												{ __( 'Add', 'jetpack-videopress-pkg' ) }
											</Button>
										</form>
									) }
									{ addError && (
										<Notice.Root intent="error">
											<Notice.Description>{ addError }</Notice.Description>
										</Notice.Root>
									) }
									{ values.videos.length > 1 && ! readOnly && (
										<Text variant="body-sm" className="vp-playlist-editor__help">
											{ __(
												'Drag videos to reorder them, or use the arrow buttons.',
												'jetpack-videopress-pkg'
											) }
										</Text>
									) }
								</Stack>
							</Card.Content>
						</Card.Root>
					</div>
					<div className="vp-playlist-editor__sidebar">
						<Card.Root className="vp-playlist-editor__details">
							<Card.Header>
								<Card.Title>{ __( 'Playlist details', 'jetpack-videopress-pkg' ) }</Card.Title>
							</Card.Header>
							<Card.Content>
								<Stack direction="column" gap="md">
									<InputControl
										label={ __( 'Title', 'jetpack-videopress-pkg' ) }
										value={ values.title }
										disabled={ readOnly }
										onValueChange={ title => update( { title } ) }
									/>
									<SwitchControl
										label={ __( 'Show title as heading', 'jetpack-videopress-pkg' ) }
										checked={ values.settings.showPlaylistTitle }
										disabled={ readOnly }
										onCheckedChange={ ( showPlaylistTitle: boolean ) =>
											updateSettings( { showPlaylistTitle } )
										}
									/>
									<TextareaControl
										label={ __( 'Description', 'jetpack-videopress-pkg' ) }
										value={ values.description }
										disabled={ readOnly }
										onValueChange={ description => update( { description } ) }
										rows={ 5 }
									/>
									<Text variant="body-sm" className="vp-playlist-editor__source">
										{ __( 'Appears in', 'jetpack-videopress-pkg' ) }{ ' ' }
										{ playlist.post.editUrl ? (
											<a
												href={ playlist.post.editUrl }
												onClick={ event => ! confirmLeave() && event.preventDefault() }
											>
												{ playlist.post.title || __( '(no title)', 'jetpack-videopress-pkg' ) }
											</a>
										) : (
											playlist.post.title
										) }
										{ playlist.post.typeLabel && ` (${ playlist.post.typeLabel })` }
									</Text>
									{ ! readOnly && (
										<div className="vp-playlist-editor__delete">
											<Button
												variant="minimal"
												size="compact"
												className="vp-playlist-editor__delete-button"
												onClick={ () => setDeleteOpen( true ) }
											>
												{ __( 'Delete playlist', 'jetpack-videopress-pkg' ) }
											</Button>
										</div>
									) }
								</Stack>
							</Card.Content>
						</Card.Root>
						<PlaybackCard
							settings={ values.settings }
							disabled={ readOnly }
							onChange={ updateSettings }
						/>
						<EntryDisplayCard
							settings={ values.settings }
							disabled={ readOnly }
							onChange={ updateSettings }
						/>
						<AppearanceCard
							settings={ values.settings }
							disabled={ readOnly }
							onChange={ updateSettings }
						/>
					</div>
				</div>
			</div>
			{ isPickerOpen && (
				<AddVideosDialog onAdd={ addFromLibrary } onClose={ () => setPickerOpen( false ) } />
			) }
			{ isDeleteOpen && (
				<DeletePlaylistDialog
					playlist={ playlist }
					isDeleting={ isDeleting }
					onCancel={ () => setDeleteOpen( false ) }
					onConfirm={ () => void confirmDelete() }
				/>
			) }
		</AdminPage>
	);
};

const StageInner = () => {
	const { key } = useParams( { from: '/playlists/$key' } );
	const query = usePlaylist( key ?? '' );

	if ( query.isLoading ) {
		return (
			<Shell label={ __( 'Loading…', 'jetpack-videopress-pkg' ) }>
				<div aria-busy="true" />
			</Shell>
		);
	}

	if ( ! query.data ) {
		return (
			<Shell label={ __( 'Not found', 'jetpack-videopress-pkg' ) }>
				<Stack direction="column" gap="md" align="center">
					<Text>{ __( "We couldn't find that playlist.", 'jetpack-videopress-pkg' ) }</Text>
					<Link to="/playlists">{ __( 'Back to Playlists', 'jetpack-videopress-pkg' ) }</Link>
				</Stack>
			</Shell>
		);
	}

	// Keyed so a save that changes the key, or a navigation, starts a fresh form.
	return <Editor key={ query.data.key } playlist={ query.data } />;
};

const Stage = () => (
	<QueryClientWrapper route="playlist">
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
