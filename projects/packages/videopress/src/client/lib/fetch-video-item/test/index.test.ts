import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import getMediaToken from '../../get-media-token';
import { createUploadAnalytics } from '../../upload-analytics';
import { fetchVideoItem } from '..';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../get-media-token', () => ( { __esModule: true, default: jest.fn() } ) );

it( 'correlates the authenticated video response without recording its playback token', async () => {
	const record = jest.mocked( jetpackAnalytics.tracks.recordEvent );
	const tracking = createUploadAnalytics( new File( [ 'x' ], 'video.mp4' ), 'block_editor' );
	tracking.start();
	tracking.succeed( 'Priv1234' );
	jest.mocked( getMediaToken ).mockResolvedValue( {
		token: 'private-playback-token',
		blogId: '1',
		url: 'https://example.com/upload',
	} );
	const video = {
		guid: 'Priv1234',
		files: { dvd: { mp4: 'private-video-path.mp4' } },
		files_status: { dvd: { mp4: 'DONE' } },
	};
	jest.mocked( apiFetch ).mockRejectedValueOnce( { error: 'auth' } ).mockResolvedValueOnce( video );
	expect( await fetchVideoItem( { guid: 'Priv1234', isPrivate: false } ) ).toEqual( video );
	expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	expect( record ).toHaveBeenCalledTimes( 3 );
	expect( record ).toHaveBeenLastCalledWith(
		'jetpack_videopress_video_playable',
		expect.objectContaining( { guid: 'Priv1234', observation_source: 'video_api' } )
	);
	expect( JSON.stringify( record.mock.calls ) ).not.toContain( 'private-' );
} );
