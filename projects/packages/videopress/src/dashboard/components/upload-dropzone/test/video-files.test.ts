/**
 * Unit tests for the shared accepted-video-file filter. Moved here from
 * routes/library/test/upload-drop.test.ts when the filter moved out of the
 * Library route so /upload and Home could reject the same files.
 */

import { filterVideoFiles } from '../video-files';

// Default to a typeless file so tests exercise the extension allow-list; pass a
// MIME type explicitly to exercise the `video/*` guard against renamed files.
const file = ( name: string, type = '' ): File => new File( [ 'x' ], name, { type } );

const setAllowedVideoExtensions = ( map: Record< string, string > | undefined ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = map
		? { allowedVideoExtensions: map }
		: undefined;
};

// Clear the initial state between tests so cases that don't set it fall back to
// the static (server-mirroring) extension list deterministically.
afterEach( () => {
	setAllowedVideoExtensions( undefined );
} );

describe( 'filterVideoFiles', () => {
	it( 'keeps only files with an allowed video extension', () => {
		const result = filterVideoFiles( [
			file( 'clip.mp4' ),
			file( 'photo.jpg' ),
			file( 'movie.MOV' ), // case-insensitive
			file( 'doc.pdf' ),
		] );
		expect( result.map( f => f.name ) ).toEqual( [ 'clip.mp4', 'movie.MOV' ] );
	} );

	it( 'accepts .mov files (regression: video/quicktime must pass)', () => {
		expect(
			filterVideoFiles( [ file( 'clip.mov', 'video/quicktime' ) ] ).map( f => f.name )
		).toEqual( [ 'clip.mov' ] );
		// And via the extension fallback when the browser leaves the type empty.
		expect( filterVideoFiles( [ file( 'clip.mov' ) ] ).map( f => f.name ) ).toEqual( [
			'clip.mov',
		] );
	} );

	it( 'rejects extensions the backend does not accept (e.g. .webm/.mkv)', () => {
		// `.webm`/`.mkv` are valid video MIME types but absent from the server
		// allow-list, so the drop filter rejects them rather than starting an
		// upload the backend would fail.
		expect( filterVideoFiles( [ file( 'clip.webm', 'video/webm' ) ] ) ).toEqual( [] );
		expect( filterVideoFiles( [ file( 'clip.mkv', 'video/x-matroska' ) ] ) ).toEqual( [] );
	} );

	it( 'sources the accepted extensions from the server allow-list', () => {
		// A site whose backend advertises `.flv` accepts it; one that omits
		// `.mp4` rejects it — proving the list comes from the initial state.
		setAllowedVideoExtensions( { flv: 'video/x-flv' } );
		expect( filterVideoFiles( [ file( 'a.flv', 'video/x-flv' ) ] ).map( f => f.name ) ).toEqual( [
			'a.flv',
		] );
		expect( filterVideoFiles( [ file( 'a.mp4', 'video/mp4' ) ] ) ).toEqual( [] );
	} );

	it( 'rejects non-video MIME types', () => {
		expect( filterVideoFiles( [ file( 'photo.jpg', 'image/jpeg' ) ] ) ).toEqual( [] );
	} );

	it( 'does not accept a non-video MIME type just because the name ends in a video extension', () => {
		// A reported MIME type is authoritative: a PDF renamed to `.mp4` must
		// not slip through the extension fallback, and neither must the `.txt`
		// renamed `.mp4` that uploaded end-to-end and then died half-broken.
		expect( filterVideoFiles( [ file( 'evil.mp4', 'application/pdf' ) ] ) ).toEqual( [] );
		expect( filterVideoFiles( [ file( 'not-a-video.mp4', 'text/plain' ) ] ) ).toEqual( [] );
	} );

	it( 'does not match an extension that is merely a substring', () => {
		// "notmp4" ends with "mp4" but not ".mp4" — the dot guards against it.
		expect( filterVideoFiles( [ file( 'video.notmp4' ) ] ) ).toEqual( [] );
	} );
} );
