/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useUploadedVideo } from '../use-uploaded-video';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isSimpleSite: () => false } ) );

const mockFetch = jest.mocked( apiFetch );

const processing = {
	id: 7,
	title: { rendered: 'Holiday' },
	mime_type: 'video/videopress',
	media_details: { videopress: { finished: false } },
	jetpack_videopress: { guid: 'abc' },
};
const ready = {
	...processing,
	media_details: {
		videopress: { finished: true, poster: 'https://videos.files.wordpress.com/abc/poster.jpg' },
	},
};

beforeEach( () => {
	jest.useFakeTimers();
	mockFetch.mockReset();
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'useUploadedVideo', () => {
	it( 'polls until the video is processed, then stops', async () => {
		mockFetch.mockResolvedValueOnce( processing ).mockResolvedValueOnce( ready );
		const { result } = renderHook( () => useUploadedVideo( 7 ) );

		await waitFor( () => expect( result.current?.isProcessing ).toBe( true ) );
		expect( mockFetch ).toHaveBeenCalledWith( { path: '/wp/v2/media/7' } );

		act( () => {
			jest.advanceTimersByTime( 5000 );
		} );
		await waitFor( () => expect( result.current?.isProcessing ).toBe( false ) );
		expect( result.current?.thumbnailUrl ).toBe(
			'https://videos.files.wordpress.com/abc/poster.jpg'
		);

		act( () => {
			jest.advanceTimersByTime( 60000 );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'keeps polling through a record that has not synced yet', async () => {
		mockFetch
			.mockRejectedValueOnce( { code: 'rest_post_invalid_id' } )
			.mockResolvedValueOnce( ready );
		const { result } = renderHook( () => useUploadedVideo( 7 ) );

		await waitFor( () => expect( mockFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current ).toBeNull();

		act( () => {
			jest.advanceTimersByTime( 5000 );
		} );
		await waitFor( () => expect( result.current?.isProcessing ).toBe( false ) );
	} );
} );
