import { useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useNavigate } from '@wordpress/route';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import FetchErrorNotice from '../../src/dashboard/components/fetch-error-notice';
import CreatePlaylistDialog from '../../src/dashboard/components/playlists/create-playlist-dialog';
import DeletePlaylistDialog from '../../src/dashboard/components/playlists/delete-playlist-dialog';
import { playlistFields } from '../../src/dashboard/components/playlists/fields';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useDeletePlaylist, usePlaylists } from '../../src/dashboard/hooks/use-playlists';
import './style.scss';
import type { PlaylistItem } from '../../src/dashboard/types/playlists';
import type { Action, SupportedLayouts, View } from '@wordpress/dataviews';

// The grid's tiles carry the title, the description and the poster's video count and status.
const GRID_VISIBLE_FIELDS: string[] = [];
const TABLE_VISIBLE_FIELDS = [ 'status', 'videoCount', 'duration', 'post', 'updated' ];

const defaultLayouts = {
	grid: { layout: { previewSize: 220, density: 'comfortable', aspectRatio: '16/9' } },
	table: { layout: { density: 'balanced', aspectRatio: '16/9' } },
} satisfies SupportedLayouts;

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	titleField: 'title',
	mediaField: 'thumbnail',
	descriptionField: 'description',
	fields: GRID_VISIBLE_FIELDS,
	layout: defaultLayouts.grid.layout,
	sort: { field: 'updated', direction: 'desc' },
	filters: [],
	search: '',
};

const getItemId = ( item: PlaylistItem ) => item.key;

const EmptyState = ( { onCreate }: { onCreate: () => void } ) => (
	<div className="vp-playlists__empty-state">
		<Card.Root className="vp-playlists__empty-card">
			<Card.Header>
				<Card.Title render={ <h2 /> }>
					{ __( 'No playlists yet', 'jetpack-videopress-pkg' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md" align="flex-start">
					<Text>
						{ __(
							'Group your videos into playlists that play one after another. Create one here, or add a Video Playlist block to any post or page.',
							'jetpack-videopress-pkg'
						) }
					</Text>
					<Button onClick={ onCreate }>
						{ __( 'Create a playlist', 'jetpack-videopress-pkg' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	</div>
);

const StageInner = () => {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ isCreating, setCreating ] = useState( false );
	const [ toDelete, setToDelete ] = useState< PlaylistItem | null >( null );
	const { items, paginationInfo, isLoading, isError, error, refetch } = usePlaylists( view );
	const { mutateAsync: deletePlaylist, isPending: isDeleting } = useDeletePlaylist();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const navigate = useNavigate();

	const onChangeView = useCallback( ( next: View ) => {
		setView( current =>
			next.type === current.type
				? next
				: {
						...next,
						fields: next.type === 'table' ? TABLE_VISIBLE_FIELDS : GRID_VISIBLE_FIELDS,
					}
		);
	}, [] );

	const actions = useMemo< Action< PlaylistItem >[] >(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'jetpack-videopress-pkg' ),
				isPrimary: true,
				isEligible: item => item.canEdit,
				callback: ( [ item ] ) => navigate( { href: `/playlists/${ item.key }` } ),
			},
			{
				id: 'view',
				label: __( 'View', 'jetpack-videopress-pkg' ),
				isEligible: item => Boolean( item.url ),
				callback: ( [ item ] ) => window.open( item.url, '_blank', 'noopener' ),
			},
			{
				id: 'edit-post',
				label: __( 'Open in editor', 'jetpack-videopress-pkg' ),
				isEligible: item => item.canEdit && Boolean( item.post.editUrl ),
				callback: ( [ item ] ) => {
					window.location.href = item.post.editUrl;
				},
			},
			{
				id: 'delete',
				label: __( 'Delete', 'jetpack-videopress-pkg' ),
				isDestructive: true,
				isEligible: item => item.canEdit,
				callback: ( [ item ] ) => setToDelete( item ),
			},
		],
		[ navigate ]
	);

	const confirmDelete = async () => {
		if ( ! toDelete ) {
			return;
		}
		try {
			await deletePlaylist( toDelete.key );
			createSuccessNotice( __( 'Playlist deleted.', 'jetpack-videopress-pkg' ), {
				type: 'snackbar',
			} );
			setToDelete( null );
		} catch ( deleteError ) {
			createErrorNotice(
				( deleteError as { message?: string } )?.message ||
					__( 'The playlist could not be deleted.', 'jetpack-videopress-pkg' ),
				{ type: 'snackbar' }
			);
		}
	};

	const isFiltered = Boolean( view.search ) || ( view.filters?.length ?? 0 ) > 0;
	const isEmptySite = ! isLoading && ! isError && ! isFiltered && paginationInfo.totalItems === 0;

	let body;
	if ( isError && items.length === 0 ) {
		body = (
			<FetchErrorNotice
				className="vp-playlists__error"
				message={ __( 'We couldn’t load your playlists.', 'jetpack-videopress-pkg' ) }
				error={ error }
				onRetry={ () => void refetch() }
			/>
		);
	} else if ( isEmptySite ) {
		body = <EmptyState onCreate={ () => setCreating( true ) } />;
	} else {
		body = (
			<DataViews< PlaylistItem >
				data={ items }
				fields={ playlistFields }
				actions={ actions }
				view={ view }
				onChangeView={ onChangeView }
				getItemId={ getItemId }
				paginationInfo={ paginationInfo }
				isLoading={ isLoading }
				defaultLayouts={ defaultLayouts }
				searchLabel={ __( 'Search playlists', 'jetpack-videopress-pkg' ) }
			/>
		);
	}

	return (
		<DashboardLayout
			activeTab="playlists"
			hideFooter
			actions={
				isEmptySite ? undefined : (
					<Button size="compact" onClick={ () => setCreating( true ) }>
						{ __( 'New playlist', 'jetpack-videopress-pkg' ) }
					</Button>
				)
			}
		>
			<div className={ `vp-playlists__viewport vp-playlists__viewport--${ view.type }` }>
				{ body }
			</div>
			{ isCreating && (
				<CreatePlaylistDialog
					onClose={ () => setCreating( false ) }
					onCreated={ playlist => {
						setCreating( false );
						navigate( { href: `/playlists/${ playlist.key }` } );
					} }
				/>
			) }
			{ toDelete && (
				<DeletePlaylistDialog
					playlist={ toDelete }
					isDeleting={ isDeleting }
					onCancel={ () => setToDelete( null ) }
					onConfirm={ () => void confirmDelete() }
				/>
			) }
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper route="playlists">
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
