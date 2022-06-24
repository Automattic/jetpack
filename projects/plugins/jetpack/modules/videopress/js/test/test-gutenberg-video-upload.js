import { jest } from '@jest/globals';

let apiFetchOriginal = null;
let apiFetchMiddlewares = [];

describe( 'gutenberg-video-upload', () => {
	beforeAll( () => {
		apiFetchOriginal = window.wp ? window.wp.apiFetch : undefined;

		delete window.videoPressUploadTrack;
		delete window.videoPressDeleteTrack;

		global.wp = {
			apiFetch: {
				use: fn => apiFetchMiddlewares.push( fn ),
			},
		};

		require( '../gutenberg-video-upload' );
	} );

	afterAll( () => {
		if ( apiFetchOriginal ) {
			window.wp.apiFetch = apiFetchOriginal;
		}

		apiFetchMiddlewares = [];
	} );

	describe( 'apiFetch middleware', () => {
		it( 'installs one middleware', () => {
			expect( apiFetchMiddlewares ).toHaveLength( 1 );
			expect( typeof apiFetchMiddlewares[ 0 ] ).toBe( 'function' );
		} );

		it( 'does not process the request body for irrelevant requests', async () => {
			expect( typeof apiFetchMiddlewares[ 0 ] ).toBe( 'function' );
			const middleware = apiFetchMiddlewares[ 0 ];

			const options = {
				path: '/foo',
				body: 'any body',
				method: 'POST',
			};

			const response = {};
			const next = jest.fn().mockReturnValue( Promise.resolve( response ) );
			await expect( middleware( options, next ) ).resolves.toBe( response );
			expect( next ).toHaveBeenCalledTimes( 1 );
			expect( next ).toHaveBeenCalledWith( options );
		} );
	} );
} );
