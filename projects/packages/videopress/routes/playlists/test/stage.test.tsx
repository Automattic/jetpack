import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as Stage } from '../stage';
import type { PlaylistItem } from '../../../src/dashboard/types/playlists';
import type { Action, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
	Link: ( { children }: { children: ReactNode } ) => <a href="#playlist">{ children }</a>,
} ) );

// Renders each item's eligible actions as buttons, plus a search trigger.
jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataViews: ( {
		data,
		actions,
		onChangeView,
		view,
	}: {
		data: PlaylistItem[];
		actions: Action< PlaylistItem >[];
		onChangeView: ( v: View ) => void;
		view: View;
	} ) => (
		<div data-testid="dataviews">
			<button onClick={ () => onChangeView( { ...view, search: 'nothing' } ) }>Search</button>
			<button onClick={ () => onChangeView( { ...view, type: 'table' } ) }>Table</button>
			<span data-testid="fields">{ view.fields?.join( ',' ) }</span>
			{ data.flatMap( item =>
				actions
					.filter( action => ! action.isEligible || action.isEligible( item ) )
					.map( action => (
						<button
							key={ `${ item.key }-${ action.id }` }
							onClick={ () =>
								'callback' in action &&
								action.callback( [ item ], { registry: {} as never } as never )
							}
						>
							{ `${ action.label } ${ item.title }` }
						</button>
					) )
			) }
		</div>
	),
} ) );

jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: ReactNode; actions?: ReactNode } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../../src/dashboard/components/playlists/create-playlist-dialog', () => ( {
	__esModule: true,
	default: ( { onCreated }: { onCreated: ( p: { key: string } ) => void } ) => (
		<button onClick={ () => onCreated( { key: 'fresh' } ) }>Create it</button>
	),
} ) );

const mockSuccess = jest.fn();
const mockError = jest.fn();
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
	useDispatch: () => ( { createSuccessNotice: mockSuccess, createErrorNotice: mockError } ),
} ) );

const ITEM = {
	key: 'trip',
	title: 'Trip',
	url: 'https://example.com/trip/',
	canEdit: true,
	post: { id: 7, title: 'Trip', type: 'page', typeLabel: 'Page', editUrl: 'post.php?post=7' },
} as unknown as PlaylistItem;

let mockTotal = 0;
let mockItems: PlaylistItem[] = [];
const mockDelete = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-playlists', () => ( {
	useDeletePlaylist: () => ( { mutateAsync: mockDelete, isPending: false } ),
	usePlaylists: () => ( {
		items: mockItems,
		paginationInfo: { totalItems: mockTotal, totalPages: mockTotal ? 1 : 0 },
		isLoading: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
	} ),
} ) );

describe( 'Playlists stage', () => {
	beforeEach( () => {
		mockItems = [];
		mockNavigate.mockReset();
		mockDelete.mockReset();
		mockSuccess.mockReset();
		mockError.mockReset();
	} );

	it( 'invites creating a playlist when the site has none', async () => {
		mockTotal = 0;
		render( <Stage /> );

		expect( screen.getByText( 'No playlists yet' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'dataviews' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Create a playlist' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create it' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/playlists/fresh' } );
	} );

	it( 'keeps the list, and its search, when a search matches nothing', async () => {
		mockTotal = 2;
		render( <Stage /> );

		mockTotal = 0;
		await userEvent.click( screen.getByRole( 'button', { name: 'Search' } ) );

		expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'No playlists yet' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the table columns when switching to the table', async () => {
		mockTotal = 1;
		mockItems = [ ITEM ];
		render( <Stage /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Table' } ) );

		expect( screen.getByTestId( 'fields' ) ).toHaveTextContent(
			'status,videoCount,duration,post,updated'
		);
	} );

	it( 'edits, views and deletes from the row actions', async () => {
		const user = userEvent.setup();
		const open = jest.spyOn( window, 'open' ).mockImplementation( () => null );
		mockTotal = 1;
		mockItems = [ ITEM ];
		mockDelete.mockResolvedValue( { deleted: true } );
		render( <Stage /> );

		await user.click( screen.getByRole( 'button', { name: 'Edit Trip' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/playlists/trip' } );

		await user.click( screen.getByRole( 'button', { name: 'View Trip' } ) );
		expect( open ).toHaveBeenCalledWith( 'https://example.com/trip/', '_blank', 'noopener' );

		await user.click( screen.getByRole( 'button', { name: 'Delete Trip' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );
		await waitFor( () => expect( mockDelete ).toHaveBeenCalledWith( 'trip' ) );
		expect( mockSuccess ).toHaveBeenCalledWith( 'Playlist deleted.', { type: 'snackbar' } );

		open.mockRestore();
	} );

	it( 'reports a failed delete', async () => {
		const user = userEvent.setup();
		mockTotal = 1;
		mockItems = [ ITEM ];
		mockDelete.mockRejectedValue( new Error( 'Locked' ) );
		render( <Stage /> );

		await user.click( screen.getByRole( 'button', { name: 'Delete Trip' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () =>
			expect( mockError ).toHaveBeenCalledWith( 'Locked', { type: 'snackbar' } )
		);
	} );
} );
