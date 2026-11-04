import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePlaylistDialog from '../create-playlist-dialog';

const mockCreate = jest.fn();
const mockErrorNotice = jest.fn();

jest.mock( '../../../hooks/use-playlists', () => ( {
	useCreatePlaylist: () => ( { mutateAsync: mockCreate, isPending: false } ),
} ) );
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
	useDispatch: () => ( { createErrorNotice: mockErrorNotice } ),
} ) );

describe( 'CreatePlaylistDialog', () => {
	beforeEach( () => {
		mockCreate.mockReset();
		mockErrorNotice.mockReset();
	} );

	it( 'creates a draft in the chosen post type and hands back the playlist', async () => {
		const user = userEvent.setup();
		const onCreated = jest.fn();
		mockCreate.mockResolvedValue( { key: 'new-one' } );
		render( <CreatePlaylistDialog onCreated={ onCreated } onClose={ jest.fn() } /> );

		const create = screen.getByRole( 'button', { name: 'Create playlist' } );
		expect( create ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.type( screen.getByRole( 'textbox', { name: 'Title' } ), '  Trips  ' );
		await user.type( screen.getByRole( 'textbox', { name: 'Description' } ), 'Summer' );
		await user.click( screen.getByRole( 'radio', { name: 'Post' } ) );
		await user.click( create );

		await waitFor( () => expect( onCreated ).toHaveBeenCalledWith( { key: 'new-one' } ) );
		expect( mockCreate ).toHaveBeenCalledWith( {
			title: 'Trips',
			description: 'Summer',
			postType: 'post',
		} );
	} );

	it( 'reports a failed create and stays open', async () => {
		const user = userEvent.setup();
		const onCreated = jest.fn();
		mockCreate.mockRejectedValue( new Error( 'Nope' ) );
		render( <CreatePlaylistDialog onCreated={ onCreated } onClose={ jest.fn() } /> );

		await user.type( screen.getByRole( 'textbox', { name: 'Title' } ), 'Trips' );
		await user.click( screen.getByRole( 'button', { name: 'Create playlist' } ) );

		await waitFor( () =>
			expect( mockErrorNotice ).toHaveBeenCalledWith( 'Nope', { type: 'snackbar' } )
		);
		expect( onCreated ).not.toHaveBeenCalled();
	} );

	it( 'closes on Cancel', async () => {
		const onClose = jest.fn();
		render( <CreatePlaylistDialog onCreated={ jest.fn() } onClose={ onClose } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalled();
	} );
} );
