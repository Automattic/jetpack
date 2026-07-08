import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import AddToPlaylistModal from '../add-to-playlist-modal';

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

type RecordedPost = { path?: string; method?: string; data?: unknown };

/**
 * Install an apiFetch handler covering the modal's traffic: the playlists
 * listing GET, the per-item membership pre-read GET, and the membership /
 * order-append POSTs. Returns the recorded POSTs for assertions.
 *
 * @param options                - Handler options.
 * @param options.failMembership - Reject the membership write for item 42.
 * @return The array collecting every POST the modal issues.
 */
function mockPlaylistApi( { failMembership = false }: { failMembership?: boolean } = {} ) {
	const posts: RecordedPost[] = [];
	mockApiFetch( async ( { path, method, data } ) => {
		if ( method === 'POST' ) {
			posts.push( { path, method, data } );
			if ( failMembership && path === '/wp/v2/media/42' ) {
				throw new Error( 'update failed' );
			}
			return {};
		}
		if ( path?.startsWith( '/wp/v2/videopress-playlists' ) ) {
			return [ { id: 7, name: 'Favorites' } ];
		}
		// Membership pre-read: /wp/v2/media/{id}?_fields=videopress-playlists.
		return { 'videopress-playlists': [] };
	} );
	return posts;
}

// These drive the component directly — the props contract used by the video
// details screen — rather than through a DataViews action modal. The library
// path exercises the identical component via `RenderModal` in actions.ts.
describe( 'AddToPlaylistModal — driven with a provided items array', () => {
	beforeEach( () => {
		mockSuccessNotice.mockClear();
		mockErrorNotice.mockClear();
	} );

	it( 'adds the provided video to the checked playlist, notifies, and closes', async () => {
		const posts = mockPlaylistApi();
		const video = makeLibraryItem();
		const closeModal = jest.fn();
		const onActionPerformed = jest.fn();

		render(
			<AddToPlaylistModal
				items={ [ video ] }
				closeModal={ closeModal }
				onActionPerformed={ onActionPerformed }
			/>,
			{ wrapper: createTestWrapper() }
		);

		await userEvent.click( await screen.findByRole( 'checkbox', { name: 'Favorites' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Add' } ) );

		await waitFor( () => expect( closeModal ).toHaveBeenCalled() );
		expect( posts ).toEqual( [
			{
				path: '/wp/v2/media/42',
				method: 'POST',
				data: { 'videopress-playlists': [ 7 ] },
			},
			{
				path: '/wp/v2/videopress-playlists/7',
				method: 'POST',
				data: { meta: { vps_playlist_order: [ 42 ] } },
			},
		] );
		expect( mockSuccessNotice ).toHaveBeenCalledWith( '1 video added to "Favorites".' );
		expect( onActionPerformed ).toHaveBeenCalledWith( [ video ] );
	} );

	it( 'confirms cleanly when the optional callbacks are omitted', async () => {
		mockPlaylistApi();

		render( <AddToPlaylistModal items={ [ makeLibraryItem() ] } />, {
			wrapper: createTestWrapper(),
		} );

		await userEvent.click( await screen.findByRole( 'checkbox', { name: 'Favorites' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Add' } ) );

		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalled() );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'surfaces an error notice when the membership write fails, then closes', async () => {
		mockPlaylistApi( { failMembership: true } );
		const closeModal = jest.fn();

		render( <AddToPlaylistModal items={ [ makeLibraryItem() ] } closeModal={ closeModal } />, {
			wrapper: createTestWrapper(),
		} );

		await userEvent.click( await screen.findByRole( 'checkbox', { name: 'Favorites' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Add' } ) );

		await waitFor( () =>
			expect( mockErrorNotice ).toHaveBeenCalledWith( 'Failed to add the video to playlists.' )
		);
		expect( closeModal ).toHaveBeenCalled();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
