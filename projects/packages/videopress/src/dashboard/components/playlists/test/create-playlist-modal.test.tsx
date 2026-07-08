import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import CreatePlaylistModal from '../create-playlist-modal';

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting rules.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

describe( 'CreatePlaylistModal', () => {
	beforeEach( () => {
		mockSuccessNotice.mockClear();
		mockErrorNotice.mockClear();
	} );

	it( 'renders the form fields inside the padded Dialog.Content region', () => {
		mockApiFetch( async () => [] );

		render( <CreatePlaylistModal isOpen onClose={ jest.fn() } />, {
			wrapper: createTestWrapper(),
		} );

		// Dialog.Popup is an unpadded flex column; body padding (and scroll)
		// comes from Dialog.Content, marked by the overlay scroll-container
		// attribute. Guards against the fields sitting flush against the
		// popup edges.
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- asserting an ancestor region requires DOM traversal.
			screen.getByLabelText( 'Name' ).closest( '[data-wp-ui-overlay-scroll-container]' )
		).not.toBeNull();

		// The popup opts into Studio's content-area centering (positioning
		// rules live in ../../studio-dialog/style.scss).
		expect( screen.getByRole( 'dialog' ) ).toHaveClass( 'videopress-studio-dialog' );
	} );

	it( 'does not submit while the name is empty or whitespace', async () => {
		const calls: unknown[] = [];
		mockApiFetch( async options => {
			calls.push( options );
			return { id: 1, name: 'x' };
		} );

		render( <CreatePlaylistModal isOpen onClose={ jest.fn() } />, {
			wrapper: createTestWrapper(),
		} );

		const createButton = screen.getByRole( 'button', { name: 'Create playlist' } );
		await userEvent.click( createButton );
		await userEvent.type( screen.getByLabelText( 'Name' ), '   ' );
		await userEvent.click( createButton );

		expect( calls ).toHaveLength( 0 );
	} );

	it( 'creates a playlist with trimmed name and description, then closes', async () => {
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			if ( method === 'POST' ) {
				calls.push( { path, method, data } );
				return { id: 12, name: 'Course videos' };
			}
			return [];
		} );

		const onClose = jest.fn();
		render( <CreatePlaylistModal isOpen onClose={ onClose } />, {
			wrapper: createTestWrapper(),
		} );

		await userEvent.type( screen.getByLabelText( 'Name' ), '  Course videos  ' );
		await userEvent.type( screen.getByLabelText( 'Description' ), 'All course content' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create playlist' } ) );

		await waitFor( () => expect( calls ).toHaveLength( 1 ) );
		expect( calls[ 0 ] ).toEqual( {
			path: '/wp/v2/videopress-playlists',
			method: 'POST',
			data: {
				name: 'Course videos',
				description: 'All course content',
			},
		} );
		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'omits the description key when left blank', async () => {
		const calls: { data?: Record< string, unknown > }[] = [];
		mockApiFetch( async ( { method, data } ) => {
			if ( method === 'POST' ) {
				calls.push( { data: data as Record< string, unknown > } );
				return { id: 5, name: 'Shorts' };
			}
			return [];
		} );

		render( <CreatePlaylistModal isOpen onClose={ jest.fn() } />, {
			wrapper: createTestWrapper(),
		} );

		await userEvent.type( screen.getByLabelText( 'Name' ), 'Shorts' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create playlist' } ) );

		await waitFor( () => expect( calls ).toHaveLength( 1 ) );
		expect( calls[ 0 ].data ).toEqual( { name: 'Shorts' } );
	} );

	it( 'surfaces an error notice and stays open when creation fails', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'POST' ) {
				throw new Error( 'term_exists' );
			}
			return [];
		} );

		const onClose = jest.fn();
		render( <CreatePlaylistModal isOpen onClose={ onClose } />, {
			wrapper: createTestWrapper(),
		} );

		await userEvent.type( screen.getByLabelText( 'Name' ), 'Duplicate' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create playlist' } ) );

		await waitFor( () => expect( mockErrorNotice ).toHaveBeenCalled() );
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
