import { mapVideoFromWPV2MediaEndpoint } from '../map-videos';
import type { OriginalVideoPressVideo } from '../../../admin/types';

/**
 * Builds a minimal media-endpoint video whose jetpack_videopress field can carry
 * ( or omit ) the is_owned flag the server sets after confirming ownership.
 *
 * @param {object} jetpackVideoPressOverrides - Overrides merged into jetpack_videopress.
 * @return {OriginalVideoPressVideo} A media-endpoint video shape.
 */
const buildVideo = ( jetpackVideoPressOverrides = {} ): OriginalVideoPressVideo =>
	( {
		id: 1,
		jetpack_videopress_guid: 'abcd1234',
		media_details: { width: 1920, height: 1080, videopress: { original: 'https://x/o.mp4' } },
		jetpack_videopress: {
			title: 'T',
			description: '',
			caption: '',
			rating: 'G',
			allow_download: 0,
			display_embed: 0,
			privacy_setting: 2,
			needs_playback_token: false,
			is_private: false,
			...jetpackVideoPressOverrides,
		},
	} ) as unknown as OriginalVideoPressVideo;

describe( 'mapVideoFromWPV2MediaEndpoint isOwned mapping', () => {
	it( 'defaults to owned when the server omits is_owned', () => {
		expect( mapVideoFromWPV2MediaEndpoint( buildVideo() ).isOwned ).toBe( true );
	} );

	it( 'is owned when is_owned is true', () => {
		expect( mapVideoFromWPV2MediaEndpoint( buildVideo( { is_owned: true } ) ).isOwned ).toBe(
			true
		);
	} );

	it( 'is not owned when the server marks the video moved ( is_owned false )', () => {
		expect( mapVideoFromWPV2MediaEndpoint( buildVideo( { is_owned: false } ) ).isOwned ).toBe(
			false
		);
	} );
} );
