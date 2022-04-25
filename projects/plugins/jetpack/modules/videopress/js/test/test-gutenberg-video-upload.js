/**
 * External dependencies
 */
import { expect } from 'chai';

let apiFetchOriginal = null;
let apiFetchMiddlewares = [];

describe( 'gutenberg-video-upload', () => {
	before( () => {
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

	after( () => {
		if ( apiFetchOriginal ) {
			window.wp.apiFetch = apiFetchOriginal;
		}

		apiFetchMiddlewares = [];
	} );

	describe( 'apiFetch middleware', () => {
		it( 'installs one middleware', () => {
			expect( apiFetchMiddlewares.length ).to.equal( 1 );
			expect( typeof apiFetchMiddlewares[ 0 ] ).to.equal( 'function' );
		} );

		it( 'does not process the request body for irrelevant requests', done => {
			expect( typeof apiFetchMiddlewares[ 0 ] ).to.equal( 'function' );
			const middleware = apiFetchMiddlewares[ 0 ];

			const next = () => {
				done();
			};

			const options = {
				path: '/foo',
				body: 'any body',
				method: 'POST',
			};

			middleware( options, next );
		} );
	} );
} );
