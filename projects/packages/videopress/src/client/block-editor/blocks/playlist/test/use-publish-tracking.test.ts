import jetpackAnalytics from '@automattic/jetpack-analytics';
import { renderHook } from '@testing-library/react';
import usePublishTracking from '../use-publish-tracking';

// Editor-store state driving the hook.
let mockIsPublishing = false;
let mockPlaylistClientIds: string[] = [ 'playlist-client-1' ];

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( {
			isPublishingPost: () => mockIsPublishing,
			getCurrentPostType: () => 'post',
			getBlocksByName: () => mockPlaylistClientIds,
		} ) ),
} ) );

const recordEventMock = jetpackAnalytics.tracks.recordEvent as jest.Mock;

beforeEach( () => {
	jest.clearAllMocks();
	mockIsPublishing = false;
	mockPlaylistClientIds = [ 'playlist-client-1' ];
} );

describe( 'usePublishTracking', () => {
	it( 'records one event when the post is being published', () => {
		mockIsPublishing = true;

		const { rerender } = renderHook( () =>
			usePublishTracking( { clientId: 'playlist-client-1', layout: 'grid', videoCount: 2 } )
		);
		// Publishing spans several renders; the event must not repeat.
		rerender();

		expect( recordEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordEventMock ).toHaveBeenCalledWith( 'jetpack_videopress_playlist_block_published', {
			post_type: 'post',
			layout: 'grid',
			video_count: 2,
			playlist_count: 1,
		} );
	} );

	it( 'does nothing while the post is not being published', () => {
		renderHook( () =>
			usePublishTracking( { clientId: 'playlist-client-1', layout: 'side-rail', videoCount: 1 } )
		);

		expect( recordEventMock ).not.toHaveBeenCalled();
	} );

	it( 'leaves reporting to the first playlist block in the post', () => {
		mockIsPublishing = true;
		mockPlaylistClientIds = [ 'another-playlist', 'playlist-client-1' ];

		renderHook( () =>
			usePublishTracking( { clientId: 'playlist-client-1', layout: 'strip', videoCount: 3 } )
		);

		expect( recordEventMock ).not.toHaveBeenCalled();
	} );

	it( 'counts every playlist block in the post', () => {
		mockIsPublishing = true;
		mockPlaylistClientIds = [ 'playlist-client-1', 'another-playlist' ];

		renderHook( () =>
			usePublishTracking( { clientId: 'playlist-client-1', layout: 'side-rail', videoCount: 5 } )
		);

		expect( recordEventMock ).toHaveBeenCalledWith( 'jetpack_videopress_playlist_block_published', {
			post_type: 'post',
			layout: 'side-rail',
			video_count: 5,
			playlist_count: 2,
		} );
	} );
} );
