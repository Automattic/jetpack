/**
 * Unit tests for the drag-and-drop upload decision logic powering the
 * VideoPress Library DropZone (see routes/library/stage.tsx). The file-type
 * filter it builds on has its own tests next to the shared dropzone
 * (components/upload-dropzone/test/video-files.test.ts).
 */

import { planVideoDrop } from '../upload-drop';
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
