/**
 * Unit tests for the drag-and-drop upload decision logic powering the
 * VideoPress Library DropZone (see routes/library/stage.tsx).
 */

import { filterVideoFiles, planVideoDrop } from '../upload-drop';
import type { DropPlanFreeTier } from '../upload-drop';

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

const PAID: DropPlanFreeTier = {
	isFree: false,
	isUnlimited: false,
	limit: 1,
	videoCount: 0,
};

const FREE_EMPTY: DropPlanFreeTier = {
	isFree: true,
	isUnlimited: false,
	limit: 1,
	videoCount: 0,
};

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
		// not slip through the extension fallback.
		expect( filterVideoFiles( [ file( 'evil.mp4', 'application/pdf' ) ] ) ).toEqual( [] );
	} );

	it( 'does not match an extension that is merely a substring', () => {
		// "notmp4" ends with "mp4" but not ".mp4" — the dot guards against it.
		expect( filterVideoFiles( [ file( 'video.notmp4' ) ] ) ).toEqual( [] );
	} );
} );

describe( 'planVideoDrop', () => {
	it( 'returns no-videos when nothing dropped is a video', () => {
		expect( planVideoDrop( [ file( 'a.jpg' ), file( 'b.pdf' ) ], PAID ) ).toEqual( {
			kind: 'no-videos',
		} );
	} );

	it( 'returns at-limit when the free plan is already at its cap', () => {
		const atLimit = { ...FREE_EMPTY, videoCount: 1 };
		expect( planVideoDrop( [ file( 'a.mp4' ) ], atLimit ) ).toEqual( { kind: 'at-limit' } );
	} );

	it( 'never caps an unlimited plan, even when it is over the nominal limit', () => {
		// The library hook can report `isUnlimited: true` alongside a videoCount
		// at/over the limit; an unlimited plan must still upload everything.
		const unlimitedOverLimit = { ...FREE_EMPTY, isUnlimited: true, videoCount: 5 };
		const decision = planVideoDrop( [ file( 'a.mp4' ), file( 'b.mov' ) ], unlimitedOverLimit );
		expect( decision ).toMatchObject( { kind: 'ok', skipped: 0 } );
		expect( decision.kind === 'ok' && decision.toUpload.map( f => f.name ) ).toEqual( [
			'a.mp4',
			'b.mov',
		] );
	} );

	it( 'uploads everything on a paid plan', () => {
		const decision = planVideoDrop( [ file( 'a.mp4' ), file( 'b.mov' ), file( 'c.m4v' ) ], PAID );
		expect( decision ).toMatchObject( { kind: 'ok', skipped: 0 } );
		expect( decision.kind === 'ok' && decision.toUpload.map( f => f.name ) ).toEqual( [
			'a.mp4',
			'b.mov',
			'c.m4v',
		] );
	} );

	it( 'uploads everything on an unlimited (free-flagged) plan', () => {
		const unlimited = { ...FREE_EMPTY, isUnlimited: true };
		const decision = planVideoDrop( [ file( 'a.mp4' ), file( 'b.mov' ) ], unlimited );
		expect( decision ).toMatchObject( { kind: 'ok', skipped: 0 } );
	} );

	it( 'caps a free-plan multi-drop to the remaining slots and reports the rest skipped', () => {
		const decision = planVideoDrop(
			[ file( 'a.mp4' ), file( 'b.mov' ), file( 'photo.jpg' ), file( 'c.m4v' ) ],
			FREE_EMPTY
		);
		// 3 videos pass the filter, 1 free slot → 1 uploaded, 2 skipped.
		expect( decision ).toMatchObject( { kind: 'ok', skipped: 2 } );
		expect( decision.kind === 'ok' && decision.toUpload.map( f => f.name ) ).toEqual( [ 'a.mp4' ] );
	} );

	it( 'accounts for already-stored videos when computing remaining slots', () => {
		// A higher free limit with some slots used: limit 3, 2 used → 1 free.
		const partlyUsed = { ...FREE_EMPTY, limit: 3, videoCount: 2 };
		const decision = planVideoDrop( [ file( 'a.mp4' ), file( 'b.mov' ) ], partlyUsed );
		expect( decision ).toMatchObject( { kind: 'ok', skipped: 1 } );
		expect( decision.kind === 'ok' && decision.toUpload.map( f => f.name ) ).toEqual( [ 'a.mp4' ] );
	} );
} );
