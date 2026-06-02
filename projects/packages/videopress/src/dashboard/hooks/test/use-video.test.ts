import { renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useVideo } from '../use-video';

describe( 'useVideo', () => {
	it( 'fetches /wp/v2/media/{id} and maps to LibraryItem', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/wp/v2/media/42' ) {
				return {
					id: 42,
					title: { rendered: 'V' },
					source_url: 'https://example.com/v.mp4',
					media_details: { length: 60, filesize: 1000 },
					jetpack_videopress: {
						guid: 'g',
						rating: 'G',
						display_embed: 1,
						allow_download: 0,
						privacy_setting: 1,
						tracks: {
							captions: {
								en: {
									src: 'english.vtt',
									label: 'English',
								},
							},
						},
					},
				};
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useVideo( 42 ), { wrapper: createTestWrapper() } );

		await waitFor( () => expect( result.current.video ).toBeDefined() );
		expect( result.current.video?.title ).toBe( 'V' );
		expect( result.current.video?.privacy ).toBe( 'private' );
		expect( result.current.video?.displayEmbed ).toBe( true );
		expect( result.current.video?.tracks ).toEqual( [
			{ kind: 'captions', srcLang: 'en', src: 'english.vtt', label: 'English' },
		] );
	} );
} );
