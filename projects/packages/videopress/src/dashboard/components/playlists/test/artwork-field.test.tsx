import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import { selectImageFromMediaLibrary } from '../../../utils/select-image-from-media-library';
import ArtworkField, { PlaylistDetailArtwork } from '../artwork-field';
import type { PlaylistVideo } from '../../../hooks/use-playlist-videos';
import type { Playlist } from '../../../types/playlist';

jest.mock( '../../../utils/select-image-from-media-library', () => ( {
	selectImageFromMediaLibrary: jest.fn(),
} ) );
const mockedSelectImage = selectImageFromMediaLibrary as unknown as jest.Mock;

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

const makePlaylist = ( overrides: Partial< Playlist > = {} ): Playlist => ( {
	id: 1,
	name: 'My playlist',
	description: '',
	count: 2,
	artworkId: null,
	order: [],
	...overrides,
} );

const makeVideo = ( id: number, extra: Partial< PlaylistVideo > = {} ): PlaylistVideo => ( {
	id,
	title: `Video ${ id }`,
	thumbnailUrl: `https://example.com/poster-${ id }.jpg`,
	durationSeconds: 60,
	uploadDate: '2026-01-01T00:00:00',
	playlistIds: [ 1 ],
	...extra,
} );

beforeEach( () => {
	mockedSelectImage.mockReset();
	mockSuccessNotice.mockReset();
	mockErrorNotice.mockReset();
	// Provide window.wp.media so the media-library actions are available.
	( window as unknown as { wp?: { media?: unknown } } ).wp = { media: jest.fn() };
} );

afterEach( () => {
	delete ( window as unknown as { wp?: { media?: unknown } } ).wp;
} );

describe( 'ArtworkField (list cell)', () => {
	it( 'falls back to the first ordered video poster when artwork is unset', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path?.includes( 'include=7' ) ) {
				return [
					{
						id: 7,
						media_type: 'file',
						mime_type: 'video/videopress',
						media_details: { videopress: { poster: 'https://example.com/poster-7.jpg' } },
					},
				];
			}
			return [];
		} );

		render( <ArtworkField item={ makePlaylist( { order: [ 7, 8 ] } ) } />, {
			wrapper: createTestWrapper(),
		} );

		const image = await screen.findByAltText( 'My playlist' );
		expect( image ).toHaveAttribute( 'src', 'https://example.com/poster-7.jpg' );
	} );

	it( 'shows the placeholder when there is no artwork and no videos', () => {
		const mocked = mockApiFetch( async () => [] );

		render( <ArtworkField item={ makePlaylist() } />, { wrapper: createTestWrapper() } );

		expect( screen.getByText( 'No artwork' ) ).toBeInTheDocument();
		expect( mocked ).not.toHaveBeenCalled();
	} );
} );

describe( 'PlaylistDetailArtwork', () => {
	it( 'opens the update menu with both actions', async () => {
		const user = userEvent.setup();
		mockApiFetch( async () => [] );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [ makeVideo( 7 ) ] } />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		expect( screen.getByRole( 'menuitem', { name: /select from playlist/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: /upload image/i } ) ).toBeInTheDocument();
	} );

	it( 'shows the first video poster as the unset-artwork fallback without fetching', () => {
		const mocked = mockApiFetch( async () => [] );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [ makeVideo( 7 ) ] } />, {
			wrapper: createTestWrapper(),
		} );

		expect( screen.getByAltText( 'My playlist' ) ).toHaveAttribute(
			'src',
			'https://example.com/poster-7.jpg'
		);
		expect( mocked ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the order[0] poster lookup while the members are still loading', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path?.includes( 'include=7' ) ) {
				return [
					{
						id: 7,
						media_type: 'file',
						mime_type: 'video/videopress',
						media_details: { videopress: { poster: 'https://example.com/poster-7.jpg' } },
					},
				];
			}
			return [];
		} );

		// While the members fetch is in flight `videos` is [], which must not
		// flash the placeholder: the hook resolves the fallback from order[0].
		render(
			<PlaylistDetailArtwork
				playlist={ makePlaylist( { order: [ 7, 8 ] } ) }
				videos={ [] }
				videosLoading
			/>,
			{ wrapper: createTestWrapper() }
		);

		const image = await screen.findByAltText( 'My playlist' );
		expect( image ).toHaveAttribute( 'src', 'https://example.com/poster-7.jpg' );
	} );

	it( 'disables Select from playlist while the members are still loading', async () => {
		const user = userEvent.setup();
		mockApiFetch( async () => [] );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [] } videosLoading />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		expect( screen.getByRole( 'menuitem', { name: /select from playlist/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables Select from playlist when the playlist has no videos', async () => {
		const user = userEvent.setup();
		mockApiFetch( async () => [] );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [] } />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		// @wordpress/components MenuItem marks a disabled item with aria-disabled
		// (keeping it focusable) rather than the native disabled attribute.
		expect( screen.getByRole( 'menuitem', { name: /select from playlist/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'sets the chosen video attachment as artwork via Select from playlist', async () => {
		const user = userEvent.setup();
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			if ( method === 'POST' ) {
				calls.push( { path, method, data } );
				return { id: 1, name: 'My playlist', meta: { vps_playlist_artwork_id: 8 } };
			}
			return [];
		} );

		render(
			<PlaylistDetailArtwork
				playlist={ makePlaylist() }
				videos={ [ makeVideo( 7 ), makeVideo( 8 ) ] }
			/>,
			{ wrapper: createTestWrapper() }
		);

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /select from playlist/i } ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Use the poster of Video 8 as artwork' } )
		);

		await waitFor( () => expect( calls ).toHaveLength( 1 ) );
		expect( calls[ 0 ] ).toEqual( {
			path: '/wp/v2/videopress-playlists/1',
			method: 'POST',
			data: { meta: { vps_playlist_artwork_id: 8 } },
		} );
		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalled() );
		// The dialog closes after selection.
		expect(
			screen.queryByRole( 'button', { name: 'Use the poster of Video 8 as artwork' } )
		).not.toBeInTheDocument();
	} );

	it( 'sets the picked media-library image as artwork via Upload image', async () => {
		const user = userEvent.setup();
		mockedSelectImage.mockResolvedValueOnce( { id: 33, url: 'https://example.com/art.jpg' } );
		const calls: { path?: string; data?: unknown }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			if ( method === 'POST' ) {
				calls.push( { path, data } );
				return { id: 1, name: 'My playlist', meta: { vps_playlist_artwork_id: 33 } };
			}
			return [];
		} );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [ makeVideo( 7 ) ] } />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		await waitFor( () => expect( calls ).toHaveLength( 1 ) );
		expect( calls[ 0 ] ).toEqual( {
			path: '/wp/v2/videopress-playlists/1',
			data: { meta: { vps_playlist_artwork_id: 33 } },
		} );
		expect( mockedSelectImage ).toHaveBeenCalledWith( {
			title: 'Select artwork',
			buttonText: 'Use this image as artwork',
		} );
	} );

	it( 'does not mutate when the media library is dismissed', async () => {
		const user = userEvent.setup();
		mockedSelectImage.mockResolvedValueOnce( null );
		const mocked = mockApiFetch( async () => [] );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [ makeVideo( 7 ) ] } />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		expect( mocked ).not.toHaveBeenCalled();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'surfaces an error notice when the artwork update fails', async () => {
		const user = userEvent.setup();
		mockedSelectImage.mockResolvedValueOnce( { id: 33, url: 'x' } );
		mockApiFetch( async ( { method } ) => {
			if ( method === 'POST' ) {
				throw new Error( 'nope' );
			}
			return [];
		} );

		render( <PlaylistDetailArtwork playlist={ makePlaylist() } videos={ [ makeVideo( 7 ) ] } />, {
			wrapper: createTestWrapper(),
		} );

		await user.click( screen.getByRole( 'button', { name: /update artwork/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		await waitFor( () => expect( mockErrorNotice ).toHaveBeenCalled() );
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
