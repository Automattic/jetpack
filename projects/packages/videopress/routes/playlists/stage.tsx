import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from '@wordpress/route';
import { Button, EmptyState, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { buildPlaylistActions } from '../../src/dashboard/components/playlists/actions';
import CreatePlaylistModal from '../../src/dashboard/components/playlists/create-playlist-modal';
import { playlistFields } from '../../src/dashboard/components/playlists/fields';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { usePlaylists } from '../../src/dashboard/hooks/use-playlists';
import { isStudioEnabled } from '../../src/dashboard/utils/studio';
import './style.scss';
import type { Playlist } from '../../src/dashboard/types/playlist';
import type { SupportedLayouts, View } from '@wordpress/dataviews';

const TABLE_VISIBLE_FIELDS = [ 'type', 'count' ];

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 12,
	titleField: 'name',
	mediaField: 'artwork',
	fields: TABLE_VISIBLE_FIELDS,
	layout: { density: 'balanced' },
	sort: { field: 'name', direction: 'asc' },
	filters: [],
	search: '',
};

const defaultLayouts: SupportedLayouts = {
	table: { layout: { density: 'balanced' } },
	grid: { layout: { previewSize: 220, density: 'comfortable' } },
};

// Deep-link fallback for when the feature flag is off. The flag also strips
// this route from the server-side registry, so this only renders in edge
// cases (e.g. a stale client); mirrors routes/video/stage.tsx's NotFound.
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
		<div className="vp-playlists vp-playlists__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that page.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

const StageInner = () => {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ isCreateOpen, setCreateOpen ] = useState( false );

	const { playlists, isLoading } = usePlaylists();

	// The playlists collection is small (single request, capped at 100), so
	// search/sort/filter/pagination all run client-side, unlike the Library's
	// server-driven view.
	const { data: shownPlaylists, paginationInfo } = useMemo(
		() => filterSortAndPaginate( playlists, view, playlistFields ),
		[ playlists, view ]
	);

	const navigate = useNavigate();
	const openPlaylist = useCallback(
		( id: number ) => {
			navigate( { href: `/playlists/${ id }` } );
		},
		[ navigate ]
	);

	const actions = useMemo( () => buildPlaylistActions( { openPlaylist } ), [ openPlaylist ] );

	const getItemId = useCallback( ( item: Playlist ) => String( item.id ), [] );
	const onClickItem = useCallback(
		( item: Playlist ) => openPlaylist( item.id ),
		[ openPlaylist ]
	);

	const openCreateModal = useCallback( () => setCreateOpen( true ), [] );
	const closeCreateModal = useCallback( () => setCreateOpen( false ), [] );

	// With a search or filter active an empty result set means "no matches",
	// not "no playlists" — don't push the create CTA there.
	const hasActiveQuery = Boolean( view.search ) || ( view.filters?.length ?? 0 ) > 0;
	const empty = hasActiveQuery ? (
		<Text>{ __( 'No playlists found.', 'jetpack-videopress-pkg' ) }</Text>
	) : (
		<EmptyState.Root>
			<EmptyState.Title>{ __( 'No playlists yet', 'jetpack-videopress-pkg' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					'Group your videos into playlists to organize and present them together.',
					'jetpack-videopress-pkg'
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button onClick={ openCreateModal }>
					{ __( 'Create playlist', 'jetpack-videopress-pkg' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);

	return (
		<DashboardLayout
			activeTab="playlists"
			hideFooter
			actions={
				<Button size="compact" onClick={ openCreateModal }>
					{ __( 'New playlist', 'jetpack-videopress-pkg' ) }
				</Button>
			}
		>
			<div className={ `vp-playlists__viewport vp-playlists__viewport--${ view.type }` }>
				<DataViews< Playlist >
					data={ shownPlaylists }
					fields={ playlistFields }
					actions={ actions }
					view={ view }
					onChangeView={ setView }
					selection={ selection }
					onChangeSelection={ setSelection }
					getItemId={ getItemId }
					paginationInfo={ paginationInfo }
					isLoading={ isLoading }
					defaultLayouts={ defaultLayouts }
					onClickItem={ onClickItem }
					empty={ empty }
				/>
			</div>
			<CreatePlaylistModal isOpen={ isCreateOpen } onClose={ closeCreateModal } />
		</DashboardLayout>
	);
};

const Stage = () => {
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
