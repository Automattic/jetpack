import { jest } from '@jest/globals';
import jQuery from 'jquery';

let wpOriginal;
let responseOriginal;
let wp;
let apiFetchMiddlewares = [];

describe( 'gutenberg-video-upload', () => {
	beforeAll( () => {
		wpOriginal = window.wp;
		responseOriginal = global.Response;
		global.Response = class {
			ok = true;
			constructor( data ) {
				this.data = data;
			}
			json() {
				return Promise.resolve( this.data );
			}
		};
		const apiFetch = jest.fn();
		apiFetch.use = fn => apiFetchMiddlewares.push( fn );
		wp = global.wp = { apiFetch, media: { ajax: jest.fn() } };

		require( '../gutenberg-video-upload' );
	} );

	beforeEach( () => {
		window.videoPressGutenbergUploadEnabled = true;
		wp.apiFetch.mockReset();
		wp.media.ajax.mockReset();
		wp.media.ajax.mockReturnValue( jQuery.Deferred().reject().promise() );
	} );

	afterEach( () => {
		delete window.videoPressGutenbergUploadEnabled;
	} );

	afterAll( () => {
		window.wp = wpOriginal;
		global.Response = responseOriginal;
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

		describe( 'video uploads', () => {
			let options;
			let file;
			const attachment = { id: 123, source_url: 'https://example.org/video.mp4' };
			const token = {
				upload_token: 'token',
				upload_blog_id: 456,
				upload_action_url: 'https://example.org/media/new',
			};

			beforeEach( () => {
				file = new File( [ 'video' ], 'video.mp4', { type: 'video/mp4' } );
				const body = new FormData();
				body.set( 'file', file );
				options = { path: '/wp/v2/media', method: 'POST', body };
			} );

			it( 'leaves unentitled uploads local without requesting a token', async () => {
				window.videoPressGutenbergUploadEnabled = false;
				const next = jest.fn().mockResolvedValue( attachment );

				await expect( apiFetchMiddlewares[ 0 ]( options, next ) ).resolves.toBe( attachment );

				expect( wp.media.ajax ).not.toHaveBeenCalled();
				expect( next ).toHaveBeenCalledWith( options );
				expect( wp.apiFetch ).not.toHaveBeenCalled();
				expect( window.videoPressUploadTrack ).toEqual( expect.any( Function ) );
				expect( window.videoPressUploadPoster ).toEqual( expect.any( Function ) );
			} );

			it.each( [ false, true ] )(
				'preserves a successful local upload after token failure (raw response: %s)',
				async raw => {
					const response = raw ? new Response( attachment ) : attachment;
					options.parse = ! raw;
					const next = jest.fn().mockResolvedValue( response );

					await expect( apiFetchMiddlewares[ 0 ]( options, next ) ).resolves.toBe( response );

					expect( options.path ).toBe( '/wp/v2/media' );
					expect( options.body.get( 'file' ) ).toBe( file );
					expect( next ).toHaveBeenCalledTimes( 1 );
					expect( wp.apiFetch ).not.toHaveBeenCalled();
				}
			);

			it.each( [ 'upload_token', 'upload_blog_id', 'upload_action_url' ] )(
				'keeps the local request intact when the token response lacks %s',
				async field => {
					const incompleteToken = { ...token };
					delete incompleteToken[ field ];
					wp.media.ajax.mockReturnValue( jQuery.Deferred().resolve( incompleteToken ).promise() );
					const next = jest.fn().mockResolvedValue( attachment );

					await expect( apiFetchMiddlewares[ 0 ]( options, next ) ).resolves.toBe( attachment );

					expect( options.path ).toBe( '/wp/v2/media' );
					expect( options.headers ).toBeUndefined();
					expect( options.body.get( 'file' ) ).toBe( file );
					expect( wp.apiFetch ).not.toHaveBeenCalled();
				}
			);

			it.each( [ false, true ] )(
				'resolves a redirected upload to the editor attachment (raw response: %s)',
				async raw => {
					wp.media.ajax.mockReturnValue( jQuery.Deferred().resolve( token ).promise() );
					wp.apiFetch.mockResolvedValue( attachment );
					const data = { media: [ { ID: attachment.id } ] };
					const next = jest.fn().mockResolvedValue( raw ? new Response( data ) : data );
					options.parse = ! raw;

					await expect( apiFetchMiddlewares[ 0 ]( options, next ) ).resolves.toBe( attachment );

					expect( options.path ).toBeUndefined();
					expect( options.url ).toBe( token.upload_action_url );
					expect( options.body.get( 'media[]' ) ).toBe( file );
					expect( options.body.has( 'file' ) ).toBe( false );
					expect( wp.apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/media/123' } );
				}
			);

			it( 'preserves a local upload error after token failure', async () => {
				const error = { code: 'rest_upload_unknown_error', message: 'Upload failed.' };
				const next = jest.fn().mockRejectedValue( error );

				await expect( apiFetchMiddlewares[ 0 ]( options, next ) ).rejects.toBe( error );
				expect( wp.apiFetch ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
