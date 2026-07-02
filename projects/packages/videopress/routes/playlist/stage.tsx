import AdminPage from '@automattic/jetpack-components/admin-page';
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { SelectControl, TextareaControl } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Button, Card, EmptyState, InputControl, Stack, Text } from '@wordpress/ui';
import { PlaylistDetailArtwork } from '../../src/dashboard/components/playlists/artwork-field';
import { PLAYLIST_TYPE_LABELS } from '../../src/dashboard/components/playlists/fields';
import SortableVideoList from '../../src/dashboard/components/playlists/sortable-video-list';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { usePlaylist } from '../../src/dashboard/hooks/use-playlist';
import { usePlaylistVideos } from '../../src/dashboard/hooks/use-playlist-videos';
import { useRemoveFromPlaylist } from '../../src/dashboard/hooks/use-remove-from-playlist';
import { useReorderPlaylist } from '../../src/dashboard/hooks/use-reorder-playlist';
import { useUpdatePlaylist } from '../../src/dashboard/hooks/use-update-playlist';
import { isStudioEnabled } from '../../src/dashboard/utils/studio';
import './style.scss';
import type { PlaylistVideo } from '../../src/dashboard/hooks/use-playlist-videos';
import type { PlaylistPatch } from '../../src/dashboard/hooks/use-update-playlist';
import type { Playlist, PlaylistType } from '../../src/dashboard/types/playlist';

const TYPE_OPTIONS = Object.entries( PLAYLIST_TYPE_LABELS ).map( ( [ value, label ] ) => ( {
	value,
	label,
} ) );

// Rendered when the flag is off (deep-link on a stale client; the flag also
// strips this route from the server-side registry) and when the term id
// doesn't resolve to a playlist; mirrors routes/video/stage.tsx's NotFound.
const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-playlist vp-playlist__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that playlist.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

// Placeholder shown while /wp/v2/videopress-playlists/{id} is in flight.
// Mirrors NotFound's AdminPage + breadcrumbs shell so the page chrome stays
// present rather than blanking out the viewport for the duration of the fetch.
const Loading = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: __( 'Playlists', 'jetpack-videopress-pkg' ), to: '/playlists' },
					{ label: __( 'Loading…', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-playlist vp-playlist__loading" aria-busy="true" />
	</AdminPage>
);

/**
 * Top section card, mirroring the video details screen's ThumbnailCard shape:
 * artwork on the left (with the overlaid update menu), editable name, type
 * select, and description on the right. Name and description commit on blur
 * when dirty; type commits on change. Failed saves revert the draft to the
 * server value and surface an error notice — no explicit Save button to keep
 * in sync.
 *
 * @param props               - Component props.
 * @param props.playlist      - The playlist being edited.
 * @param props.videos        - The playlist's members in display order (the
 *                            first one's poster is the unset-artwork fallback).
 * @param props.videosLoading - Whether the members fetch is still in flight,
 *                            so the artwork control can avoid a placeholder
 *                            flash while `videos` is still empty.
 * @return The card element.
 */
const PlaylistDetailsCard = ( {
	playlist,
	videos,
	videosLoading,
}: {
	playlist: Playlist;
	videos: PlaylistVideo[];
	videosLoading: boolean;
} ) => {
	const { mutate: updatePlaylist } = useUpdatePlaylist();
	const { createErrorNotice } = useGlobalNotices();
	const [ name, setName ] = useState( playlist.name );
	const [ type, setType ] = useState< PlaylistType >( playlist.type );
	const [ description, setDescription ] = useState( playlist.description );

	// Re-baseline the drafts when navigating between playlists. Deliberately
	// not keyed on the field values so a background refetch can't clobber an
	// in-progress edit.
	useEffect( () => {
		setName( playlist.name );
		setType( playlist.type );
		setDescription( playlist.description );
	}, [ playlist.id ] );

	const saveField = ( patch: PlaylistPatch, revert: () => void ) => {
		updatePlaylist(
			{ id: playlist.id, patch },
			{
				onError: () => {
					revert();
					createErrorNotice( __( 'Failed to update playlist.', 'jetpack-videopress-pkg' ) );
				},
			}
		);
	};

	const commitName = () => {
		const next = name.trim();
		// Terms can't have an empty name (WP rejects the write); revert.
		if ( ! next ) {
			setName( playlist.name );
			return;
		}
		setName( next );
		if ( next !== playlist.name ) {
			saveField( { name: next }, () => setName( playlist.name ) );
		}
	};

	const commitDescription = () => {
		if ( description !== playlist.description ) {
			saveField( { description }, () => setDescription( playlist.description ) );
		}
	};

	const onTypeChange = ( next: string ) => {
		const nextType = next as PlaylistType;
		setType( nextType );
		if ( nextType !== playlist.type ) {
			saveField( { type: nextType }, () => setType( playlist.type ) );
		}
	};

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="row" gap="md" align="start" className="vp-playlist__header">
					<div className="vp-playlist__artwork-slot">
						<PlaylistDetailArtwork
							playlist={ playlist }
							videos={ videos }
							videosLoading={ videosLoading }
						/>
					</div>
					<Stack direction="column" gap="md" className="vp-playlist__details">
						<InputControl
							label={ __( 'Name', 'jetpack-videopress-pkg' ) }
							value={ name }
							onValueChange={ next => setName( next ?? '' ) }
							onBlur={ commitName }
							required
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Type', 'jetpack-videopress-pkg' ) }
							value={ type }
							options={ TYPE_OPTIONS }
							onChange={ onTypeChange }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Description', 'jetpack-videopress-pkg' ) }
							value={ description }
							onChange={ setDescription }
							onBlur={ commitDescription }
							rows={ 3 }
						/>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

const StageReady = ( { playlist }: { playlist: Playlist } ) => {
	const navigate = useNavigate();
	const { videos, isLoading: videosLoading } = usePlaylistVideos( playlist );
	const { mutate: reorderPlaylist } = useReorderPlaylist();
	const { mutate: removeFromPlaylist } = useRemoveFromPlaylist();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const onReorder = useCallback(
		( orderedIds: number[] ) => {
			// Optimistic — the rows land in place immediately, so only
			// failures are worth a notice.
			reorderPlaylist(
				{ id: playlist.id, order: orderedIds },
				{
					onError: () => {
						createErrorNotice( __( 'Failed to reorder playlist.', 'jetpack-videopress-pkg' ) );
					},
				}
			);
		},
		[ playlist.id, reorderPlaylist, createErrorNotice ]
	);

	const onRemove = useCallback(
		( video: PlaylistVideo ) => {
			removeFromPlaylist(
				{ playlistId: playlist.id, video, order: playlist.order },
				{
					onSuccess: () => {
						createSuccessNotice( __( 'Video removed from playlist.', 'jetpack-videopress-pkg' ) );
					},
					onError: () => {
						createErrorNotice(
							__( 'Failed to remove video from playlist.', 'jetpack-videopress-pkg' )
						);
					},
				}
			);
		},
		[ playlist.id, playlist.order, removeFromPlaylist, createSuccessNotice, createErrorNotice ]
	);

	let body;
	if ( videosLoading ) {
		body = <div className="vp-playlist__loading" aria-busy="true" />;
	} else if ( videos.length === 0 ) {
		body = (
			<EmptyState.Root>
				<EmptyState.Title>
					{ __( 'No videos in this playlist yet', 'jetpack-videopress-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Add videos from your library to start building this playlist.',
						'jetpack-videopress-pkg'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button onClick={ () => navigate( { href: '/library' } ) }>
						{ __( 'Go to Library', 'jetpack-videopress-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	} else {
		body = <SortableVideoList videos={ videos } onReorder={ onReorder } onRemove={ onRemove } />;
	}

	// While the members are in flight the term count stands in, so the videos
	// card title doesn't flash "0 videos" before settling.
	const videoCount = videosLoading ? playlist.count : videos.length;

	return (
		<AdminPage
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Playlists', 'jetpack-videopress-pkg' ), to: '/playlists' },
						{ label: playlist.name },
					] }
				/>
			}
		>
			<div className="vp-playlist">
				<PlaylistDetailsCard
					playlist={ playlist }
					videos={ videos }
					videosLoading={ videosLoading }
				/>
				<Card.Root>
					<Card.Header>
						<Card.Title>
							{ sprintf(
								/* translators: %d: number of videos in the playlist. */
								_n( '%d video', '%d videos', videoCount, 'jetpack-videopress-pkg' ),
								videoCount
							) }
						</Card.Title>
					</Card.Header>
					<Card.Content>{ body }</Card.Content>
				</Card.Root>
			</div>
		</AdminPage>
	);
};

const StageInner = () => {
	const { id } = useParams( { from: '/playlists/$id' } );
	const { playlist, isLoading } = usePlaylist( id );

	if ( isLoading ) {
		return <Loading />;
	}

	if ( ! playlist ) {
		return <NotFound />;
	}

	return <StageReady playlist={ playlist } />;
};

const Stage = () => {
	// Checked before any hooks mount so a stale flag-off client doesn't fire
	// playlist fetches against unregistered REST routes.
	if ( ! isStudioEnabled() ) {
		return <NotFound />;
	}

	return (
		<QueryClientWrapper>
			<StageInner />
		</QueryClientWrapper>
	);
};

export { Stage as stage };
