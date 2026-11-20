import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApiFetch } from '../../../src/dashboard/test-utils/mock-api-fetch';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { PlaylistItem } from '../../../src/dashboard/types/playlists';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useParams: () => ( { key: 'trip' } ),
	useNavigate: () => mockNavigate,
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { actions, children }: { actions?: ReactNode; children?: ReactNode } ) => (
		<div>
			<div>{ actions }</div>
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( { Breadcrumbs: () => null } ) );

jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn( () => ( { name: 'mock-store' } ) ),
	createSelector: jest.fn( selector => selector ),
	keyedReducer: jest.fn( ( _key, reducer ) => reducer ),
	register: jest.fn(),
	select: jest.fn( () => ( {} ) ),
	dispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => ( {} ) ),
	useRegistry: jest.fn( () => ( { select: jest.fn(), dispatch: jest.fn() } ) ),
	useDispatch: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
	} ),
} ) );

let mockTestClient: QueryClient;
const mockNavigate = jest.fn();
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => {
	const { QueryClientProvider } = jest.requireActual( '@tanstack/react-query' );
	return {
		__esModule: true,
		default: ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ mockTestClient }>{ children }</QueryClientProvider>
		),
	};
} );

jest.mock( '../../../src/dashboard/hooks/use-video-live-metadata', () => ( {
	useVideoLiveMetadata: ( guid: string ) => ( { title: `Video ${ guid }` } ),
} ) );

jest.mock( '../../../src/client/lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn( async () => ( { duration: 90500, height: 720 } ) ),
} ) );

// The picker's library query is exercised in the browser; here it only hands back a pick.
const mockPicked: Partial< LibraryItem >[] = [];
jest.mock( '../../../src/dashboard/components/playlists/add-videos-dialog', () => ( {
	__esModule: true,
	default: ( { onAdd }: { onAdd: ( items: Partial< LibraryItem >[] ) => void } ) => (
		<button onClick={ () => onAdd( mockPicked ) }>Pick</button>
	),
} ) );

const PLAYLIST: PlaylistItem = {
	key: 'trip',
	title: 'Trip',
	description: '',
	videos: [ { guid: 'aaaaaaa1', durationMs: 1000 }, { guid: 'bbbbbbb2' }, { guid: 'ccccccc3' } ],
	videoCount: 3,
	durationMs: 1000,
	updated: '2026-10-30T12:00:00+00:00',
	status: 'publish',
	settings: {
		showPlaylistTitle: true,
		layout: 'side-rail',
		darkPlayer: false,
		showPlayer: true,
		entryClickAction: 'new-tab',
		autoplayNext: false,
		muteByDefault: false,
		loopPlaylist: false,
		showThumbnail: true,
		showTitle: true,
		showResolution: true,
		showDuration: true,
		showPositionNumber: false,
		showTotalRuntime: true,
		entryTitleFontFamily: '',
	},
	post: {
		id: 7,
		title: 'Travel',
		type: 'post',
		typeLabel: 'Post',
		editUrl: 'post.php?post=7&action=edit',
	},
	url: 'https://example.com/travel/',
	canEdit: true,
	canPublish: true,
};

/**
 * Serve the playlist and echo saves back, recording the saved patch.
 *
 * @param playlist - The playlist the route returns.
 * @return The apiFetch mock.
 */
function servePlaylist( playlist: PlaylistItem | null ) {
	return mockApiFetch( async ( { method, data } ) => {
		if ( ! playlist ) {
			throw { code: 'videopress_playlist_not_found', data: { status: 404 } };
		}
		return method === 'POST' ? { ...playlist, ...( data as object ) } : playlist;
	} );
}

const saveCall = ( mock: ReturnType< typeof servePlaylist > ) =>
	mock.mock.calls.map( ( [ options ] ) => options ).find( options => options.method === 'POST' );

describe( 'Playlist editor stage', () => {
	beforeEach( () => {
		const { QueryClient } = jest.requireActual( '@tanstack/react-query' );
		mockTestClient = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
		mockPicked.length = 0;
	} );

	it( 'saves the edited title with the videos reordered and removed', async () => {
		const user = userEvent.setup();
		const api = servePlaylist( PLAYLIST );
		render( <Stage /> );

		const title = await screen.findByRole( 'textbox', { name: 'Title' } );
		await user.clear( title );
		await user.type( title, 'Road trip' );
		await user.click( screen.getByRole( 'button', { name: 'Move “Video bbbbbbb2” up' } ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Remove “Video ccccccc3” from the playlist' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( saveCall( api ) ).toBeDefined() );
		expect( saveCall( api ) ).toMatchObject( {
			path: '/wpcom/v3/videopress/playlists/trip',
			data: {
				title: 'Road trip',
				description: '',
				videos: [ { guid: 'bbbbbbb2' }, { guid: 'aaaaaaa1', durationMs: 1000 } ],
			},
		} );
	} );

	it( 'appends picked videos with their duration and height, skipping ones already listed', async () => {
		const user = userEvent.setup();
		const api = servePlaylist( PLAYLIST );
		mockPicked.push(
			{ guid: 'aaaaaaa1', durationSeconds: 1 },
			{ guid: 'ddddddd4', durationSeconds: 90 }
		);
		render( <Stage /> );

		await user.click( await screen.findByRole( 'button', { name: 'Add videos' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Pick' } ) );
		await expect( screen.findByText( 'Video ddddddd4' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( saveCall( api ) ).toBeDefined() );
		expect( ( saveCall( api )?.data as PlaylistItem ).videos ).toEqual( [
			...PLAYLIST.videos,
			{ guid: 'ddddddd4', durationMs: 90500, height: 720 },
		] );
	} );

	it( 'is read-only when the user cannot edit the playlist’s post', async () => {
		servePlaylist( { ...PLAYLIST, canEdit: false } );
		render( <Stage /> );

		await expect( screen.findByRole( 'textbox', { name: 'Title' } ) ).resolves.toBeDisabled();
		// `@wordpress/ui` buttons stay focusable when disabled.
		expect( screen.getByRole( 'button', { name: 'Add videos' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'saves the block settings with the playlist', async () => {
		const user = userEvent.setup();
		const api = servePlaylist( PLAYLIST );
		render( <Stage /> );

		await user.click( await screen.findByRole( 'switch', { name: 'Loop playlist' } ) );
		await user.click( screen.getByRole( 'switch', { name: 'Position number' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Grid' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( saveCall( api ) ).toBeDefined() );
		expect( ( saveCall( api )?.data as PlaylistItem ).settings ).toEqual( {
			...PLAYLIST.settings,
			loopPlaylist: true,
			showPositionNumber: true,
			layout: 'grid',
		} );
	} );

	it( 'publishes a draft playlist with its pending edits', async () => {
		const user = userEvent.setup();
		const api = servePlaylist( { ...PLAYLIST, status: 'draft' } );
		render( <Stage /> );

		const title = await screen.findByRole( 'textbox', { name: 'Title' } );
		await user.type( title, ' 2026' );
		await user.click( screen.getByRole( 'button', { name: 'Publish' } ) );

		await waitFor( () => expect( saveCall( api ) ).toBeDefined() );
		expect( saveCall( api )?.data ).toMatchObject( { title: 'Trip 2026', status: 'publish' } );
	} );

	it( 'deletes the playlist after confirming, then returns to the list', async () => {
		const user = userEvent.setup();
		const api = servePlaylist( PLAYLIST );
		render( <Stage /> );

		await user.click( await screen.findByRole( 'button', { name: 'Delete playlist' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () =>
			expect(
				api.mock.calls.map( ( [ options ] ) => options ).find( o => o.method === 'DELETE' )
			).toMatchObject( { path: '/wpcom/v3/videopress/playlists/trip' } )
		);
		await waitFor( () => expect( mockNavigate ).toHaveBeenCalledWith( { href: '/playlists' } ) );
	} );

	it( 'shows a not-found message for an unknown playlist', async () => {
		servePlaylist( null );
		render( <Stage /> );

		await expect(
			screen.findByText( "We couldn't find that playlist." )
		).resolves.toBeInTheDocument();
	} );
} );
