import { VIDEO_INFO_URL } from '../poster';

jest.mock( '../../get-media-token', () => ( { __esModule: true, default: jest.fn() } ) );

type PosterModule = typeof import( '../poster' );
type TokenModule = typeof import( '../../get-media-token' );

declare const global: typeof globalThis & { fetch: jest.MockedFunction< typeof fetch > };

let token: jest.MockedFunction< TokenModule[ 'default' ] >;
let resolvePoster: PosterModule[ 'resolvePoster' ];

const response = ( body: unknown, ok = true ) =>
	( { ok, json: () => Promise.resolve( body ) } ) as unknown as Response;

const requestedUrls = () => global.fetch.mock.calls.map( call => String( call[ 0 ] ) );

beforeEach( () => {
	// The module remembers lookups per GUID; every test starts from a fresh copy.
	jest.resetModules();
	/* eslint-disable @typescript-eslint/no-require-imports */
	resolvePoster = ( require( '../poster' ) as PosterModule ).resolvePoster;
	token = ( require( '../../get-media-token' ) as TokenModule ).default as typeof token;
	/* eslint-enable @typescript-eslint/no-require-imports */
	// jsdom does not define `fetch`, so assign a mock rather than spy on it.
	// eslint-disable-next-line jest/prefer-spy-on
	global.fetch = jest.fn();
	token.mockResolvedValue( { token: null } );
	window.videopressAjax = { ajaxUrl: '/admin-ajax.php', bridgeUrl: '', post_id: '12' };
} );

describe( 'resolvePoster', () => {
	it( 'uses the poster of a public video without asking for a token', async () => {
		global.fetch.mockResolvedValueOnce(
			response( { poster: 'https://videos.files.wordpress.com/abcDEF12/p.jpg', is_private: false } )
		);

		await expect( resolvePoster( 'abcDEF12' ) ).resolves.toBe(
			'https://videos.files.wordpress.com/abcDEF12/p.jpg'
		);
		expect( requestedUrls() ).toEqual( [ `${ VIDEO_INFO_URL }abcDEF12` ] );
		expect( token ).not.toHaveBeenCalled();
	} );

	it( 'fetches a private video with the playback token and tokenizes its poster', async () => {
		global.fetch
			.mockResolvedValueOnce( response( { error: 'unknown_media' }, false ) )
			.mockResolvedValueOnce(
				response( {
					poster: 'https://videos.files.wordpress.com/abcDEF12/p.jpg?x=1',
					is_private: true,
				} )
			);
		token.mockResolvedValue( { token: 'jwt token' } );

		await expect( resolvePoster( 'abcDEF12' ) ).resolves.toBe(
			'https://videos.files.wordpress.com/abcDEF12/p.jpg?x=1&metadata_token=jwt%20token'
		);
		expect( token ).toHaveBeenCalledWith( 'playback', { guid: 'abcDEF12', id: 12 } );
		expect( requestedUrls()[ 1 ] ).toBe( `${ VIDEO_INFO_URL }abcDEF12?metadata_token=jwt%20token` );
	} );

	it( 'falls back to the anonymous poster of a video reported private when no token comes', async () => {
		global.fetch.mockResolvedValueOnce(
			response( { poster: 'https://videos.files.wordpress.com/abcDEF12/p.jpg', is_private: true } )
		);

		await expect( resolvePoster( 'abcDEF12' ) ).resolves.toBe(
			'https://videos.files.wordpress.com/abcDEF12/p.jpg'
		);
		expect( token ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'yields null when nothing answers, and tries again next time', async () => {
		global.fetch.mockRejectedValue( new Error( 'offline' ) );
		token.mockRejectedValue( new Error( 'no storage' ) );

		await expect( resolvePoster( 'abcDEF12' ) ).resolves.toBeNull();

		global.fetch.mockReset();
		global.fetch.mockResolvedValueOnce( response( { poster: 'https://example.com/p.jpg' } ) );
		await expect( resolvePoster( 'abcDEF12' ) ).resolves.toBe( 'https://example.com/p.jpg' );
	} );

	it( 'shares one lookup between facades of the same video', async () => {
		global.fetch.mockResolvedValue( response( { poster: 'https://example.com/p.jpg' } ) );

		const [ first, second ] = await Promise.all( [
			resolvePoster( 'abcDEF12' ),
			resolvePoster( 'abcDEF12' ),
		] );
		await resolvePoster( 'abcDEF12' );

		expect( first ).toBe( 'https://example.com/p.jpg' );
		expect( second ).toBe( 'https://example.com/p.jpg' );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
