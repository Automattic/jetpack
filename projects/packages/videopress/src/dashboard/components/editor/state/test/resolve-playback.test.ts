import { createEditSession, editSessionReducer } from '../edit-session';
import { resolvePlayback } from '../resolve-playback';
import type { CutRange, EditSession } from '../edit-session';

/**
 * Hand-build a session for the resolver, bypassing the reducer.
 *
 * @param trimStartMs - Trim window start.
 * @param trimEndMs   - Trim window end.
 * @param cuts        - Cut ranges as [startMs, endMs] pairs.
 * @param durationMs  - Master duration (default 60000).
 * @return The session.
 */
function makeSession(
	trimStartMs: number,
	trimEndMs: number,
	cuts: [ number, number ][] = [],
	durationMs = 60000
): EditSession {
	return {
		durationMs,
		trimStartMs,
		trimEndMs,
		cuts: cuts.map( ( [ startMs, endMs ], i ): CutRange => ( { id: `c${ i }`, startMs, endMs } ) ),
		selectedCutId: null,
	};
}

describe( 'resolvePlayback', () => {
	describe( 'inside the trim window with no cuts', () => {
		it( 'does nothing', () => {
			expect( resolvePlayback( 5000, makeSession( 1000, 9000 ), true ) ).toEqual( {} );
		} );

		it( 'does nothing at position zero of an untrimmed session', () => {
			expect( resolvePlayback( 0, makeSession( 0, 60000 ), true ) ).toEqual( {} );
		} );
	} );

	describe( 'trim boundaries', () => {
		const session = makeSession( 1000, 9000 );

		it( 'seeks to the trim start from before the window', () => {
			expect( resolvePlayback( 200, session, true ) ).toEqual( { seekTo: 1000 } );
		} );

		it( 'ends with a clamping seek past the trim end', () => {
			expect( resolvePlayback( 9500, session, true ) ).toEqual( { ended: true, seekTo: 9000 } );
		} );

		it( 'ends without a seek exactly at the trim end', () => {
			expect( resolvePlayback( 9000, session, true ) ).toEqual( { ended: true } );
		} );

		it( 'ends at the master duration of an untrimmed session', () => {
			expect( resolvePlayback( 60000, makeSession( 0, 60000 ), true ) ).toEqual( {
				ended: true,
			} );
		} );

		it( 'stays exactly at the trim start', () => {
			expect( resolvePlayback( 1000, session, true ) ).toEqual( {} );
		} );
	} );

	describe( 'cut skipping', () => {
		const session = makeSession( 0, 60000, [ [ 10000, 20000 ] ] );

		it( 'seeks to the cut end from inside a cut', () => {
			expect( resolvePlayback( 15000, session, true ) ).toEqual( { seekTo: 20000 } );
		} );

		it( 'skips immediately at the cut start', () => {
			expect( resolvePlayback( 10000, session, true ) ).toEqual( { seekTo: 20000 } );
		} );

		it( 'still skips one millisecond before the cut end', () => {
			expect( resolvePlayback( 19999, session, true ) ).toEqual( { seekTo: 20000 } );
		} );

		it( 'does not skip at the cut end', () => {
			expect( resolvePlayback( 20000, session, true ) ).toEqual( {} );
		} );

		it( 'does not skip just before the cut', () => {
			expect( resolvePlayback( 9999, session, true ) ).toEqual( {} );
		} );

		it( 'ends when a cut runs into the trim end', () => {
			const tail = makeSession( 0, 30000, [ [ 25000, 30000 ] ] );
			expect( resolvePlayback( 27000, tail, true ) ).toEqual( { ended: true, seekTo: 30000 } );
		} );

		it( 'chains through touching cuts', () => {
			const chained = makeSession( 0, 60000, [
				[ 10000, 20000 ],
				[ 20000, 30000 ],
			] );
			expect( resolvePlayback( 15000, chained, true ) ).toEqual( { seekTo: 30000 } );
		} );

		it( 'lands between separated cuts', () => {
			const two = makeSession( 0, 60000, [
				[ 10000, 20000 ],
				[ 30000, 40000 ],
			] );
			expect( resolvePlayback( 15000, two, true ) ).toEqual( { seekTo: 20000 } );
		} );
	} );

	describe( 'previewCutsEnabled = false', () => {
		const session = makeSession( 1000, 9000, [ [ 3000, 5000 ] ] );

		it( 'ignores cuts', () => {
			expect( resolvePlayback( 4000, session, false ) ).toEqual( {} );
		} );

		it( 'still enforces the trim start', () => {
			expect( resolvePlayback( 200, session, false ) ).toEqual( { seekTo: 1000 } );
		} );

		it( 'still enforces the trim end', () => {
			expect( resolvePlayback( 9500, session, false ) ).toEqual( { ended: true, seekTo: 9000 } );
		} );
	} );

	describe( 'input rounding', () => {
		const session = makeSession( 1000, 9000 );

		it( 'rounds up into the window', () => {
			expect( resolvePlayback( 999.7, session, true ) ).toEqual( {} );
		} );

		it( 'rounds down below the window', () => {
			expect( resolvePlayback( 999.4, session, true ) ).toEqual( { seekTo: 1000 } );
		} );
	} );

	describe( 'against reducer-built sessions', () => {
		it( 'skips a cut created through the reducer', () => {
			let session = createEditSession( 30000 );
			session = editSessionReducer( session, { type: 'SET_TRIM_START', ms: 2000 } );
			session = editSessionReducer( session, { type: 'SET_TRIM_END', ms: 28000 } );
			session = editSessionReducer( session, { type: 'ADD_CUT', atMs: 10000, id: 'c1' } );

			expect( resolvePlayback( 500, session, true ) ).toEqual( { seekTo: 2000 } );
			expect( resolvePlayback( 9000, session, true ) ).toEqual( { seekTo: 12000 } );
			expect( resolvePlayback( 15000, session, true ) ).toEqual( {} );
			expect( resolvePlayback( 29000, session, true ) ).toEqual( {
				ended: true,
				seekTo: 28000,
			} );
		} );
	} );
} );
