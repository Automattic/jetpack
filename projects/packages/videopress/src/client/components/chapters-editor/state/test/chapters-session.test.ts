import {
	parseDescription,
	serializeDescription,
} from '../../../../utils/video-chapters/description';
import {
	ADD_DEDUPE_MS,
	CHAPTER_MIN_GAP_MS,
	canAddChapterAt,
	chaptersEditsEqual,
	chaptersSessionReducer,
	chaptersToRows,
	createChaptersSession,
	isChaptersDirty,
} from '../chapters-session';
import type { ChapterRow } from '../../../../utils/video-chapters/description';
import type { ChaptersSession, ChaptersSessionAction } from '../chapters-session';

const reduce = ( state: ChaptersSession, action: ChaptersSessionAction ) =>
	chaptersSessionReducer( state, action );

/**
 * Build a session by LOADing rows, the way the tool mounts.
 *
 * @param rows       - Chapter rows (seconds).
 * @param durationMs - Video duration in ms.
 * @return The loaded session.
 */
function load( rows: ChapterRow[], durationMs: number ): ChaptersSession {
	return reduce( createChaptersSession( durationMs ), { type: 'LOAD', rows, durationMs } );
}

/**
 * Shorthand for a three-chapter session at 0/30/60s in a 90s video.
 *
 * @return A loaded session.
 */
function threeChapters(): ChaptersSession {
	return load(
		[
			{ startAtSeconds: 0, title: 'Intro' },
			{ startAtSeconds: 30, title: 'Middle' },
			{ startAtSeconds: 60, title: 'End' },
		],
		90000
	);
}

/**
 * Assert every structural invariant the reducer promises.
 *
 * @param session - Session to check.
 */
function assertInvariants( session: ChaptersSession ) {
	expect( session.chapters.length ).toBeGreaterThan( 0 );
	expect( session.chapters[ 0 ].startMs ).toBe( 0 );
	for ( let i = 0; i < session.chapters.length; i++ ) {
		const chapter = session.chapters[ i ];
		expect( Number.isInteger( chapter.startMs ) ).toBe( true );
		expect( chapter.startMs ).toBeGreaterThanOrEqual( 0 );
		if ( i > 0 ) {
			expect( chapter.startMs ).toBeGreaterThanOrEqual( session.chapters[ i - 1 ].startMs );
		}
	}
	expect( new Set( session.chapters.map( chapter => chapter.id ) ).size ).toBe(
		session.chapters.length
	);
	if ( session.selectedId !== null ) {
		expect( session.chapters.some( chapter => chapter.id === session.selectedId ) ).toBe( true );
	}
}

describe( 'createChaptersSession', () => {
	it( 'seeds a single default chapter pinned to 0', () => {
		const session = createChaptersSession( 60000 );
		expect( session.durationMs ).toBe( 60000 );
		expect( session.chapters ).toHaveLength( 1 );
		expect( session.chapters[ 0 ].startMs ).toBe( 0 );
		expect( session.chapters[ 0 ].title ).toBe( 'Chapter 1' );
		expect( session.selectedId ).toBeNull();
		assertInvariants( session );
	} );

	it( 'rounds a fractional duration and clamps a negative one', () => {
		expect( createChaptersSession( 59999.6 ).durationMs ).toBe( 60000 );
		expect( createChaptersSession( -5 ).durationMs ).toBe( 0 );
	} );
} );

describe( 'LOAD', () => {
	it( 'converts second-granular rows to ms and preserves titles', () => {
		const session = threeChapters();
		expect( session.chapters.map( chapter => chapter.startMs ) ).toEqual( [ 0, 30000, 60000 ] );
		expect( session.chapters.map( chapter => chapter.title ) ).toEqual( [
			'Intro',
			'Middle',
			'End',
		] );
		expect( session.selectedId ).toBeNull();
		assertInvariants( session );
	} );

	it( 'sorts out-of-order rows ascending', () => {
		const session = load(
			[
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 60, title: 'C' },
				{ startAtSeconds: 30, title: 'B' },
			],
			90000
		);
		expect( session.chapters.map( chapter => chapter.title ) ).toEqual( [ 'A', 'B', 'C' ] );
		assertInvariants( session );
	} );

	it( 'pins the first chapter to 0 when the description starts later', () => {
		const session = load(
			[
				{ startAtSeconds: 5, title: 'Late start' },
				{ startAtSeconds: 30, title: 'B' },
			],
			60000
		);
		expect( session.chapters[ 0 ] ).toMatchObject( { startMs: 0, title: 'Late start' } );
		expect( session.chapters[ 1 ].startMs ).toBe( 30000 );
		assertInvariants( session );
	} );

	it( 'seeds a default chapter when the description has none', () => {
		const session = load( [], 60000 );
		expect( session.chapters ).toHaveLength( 1 );
		expect( session.chapters[ 0 ] ).toMatchObject( { startMs: 0, title: 'Chapter 1' } );
		assertInvariants( session );
	} );

	it( 'keeps starts beyond the duration for save-time validation to flag', () => {
		const session = load(
			[
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 120, title: 'Beyond' },
			],
			60000
		);
		expect( session.chapters[ 1 ].startMs ).toBe( 120000 );
	} );

	it( 'clears the selection', () => {
		const base = threeChapters();
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } );
		const reloaded = reduce( selected, {
			type: 'LOAD',
			rows: [ { startAtSeconds: 0, title: 'A' } ],
			durationMs: 60000,
		} );
		expect( reloaded.selectedId ).toBeNull();
	} );
} );

describe( 'ADD_AT', () => {
	it( 'adds at the rounded whole second with a default title and selects it', () => {
		const base = load( [ { startAtSeconds: 0, title: 'Intro' } ], 60000 );
		const session = reduce( base, { type: 'ADD_AT', atMs: 10400 } );
		expect( session.chapters ).toHaveLength( 2 );
		expect( session.chapters[ 1 ] ).toMatchObject( { startMs: 10000, title: 'Chapter 2' } );
		expect( session.selectedId ).toBe( session.chapters[ 1 ].id );
		assertInvariants( session );
	} );

	it( 'inserts sorted between existing chapters and numbers by insertion position', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'ADD_AT', atMs: 15600, id: 'new-chapter' } );
		expect( session.chapters.map( chapter => chapter.startMs ) ).toEqual( [
			0, 16000, 30000, 60000,
		] );
		expect( session.chapters[ 1 ] ).toMatchObject( {
			id: 'new-chapter',
			title: 'Chapter 2',
		} );
		expect( session.selectedId ).toBe( 'new-chapter' );
		assertInvariants( session );
	} );

	it( 'numbers a mid-list insertion by position, not by the chapter count', () => {
		const base = load(
			[
				{ startAtSeconds: 0, title: 'Chapter 1' },
				{ startAtSeconds: 60, title: 'Chapter 2' },
				{ startAtSeconds: 120, title: 'Chapter 3' },
				{ startAtSeconds: 180, title: 'Chapter 4' },
			],
			240000
		);
		const session = reduce( base, { type: 'ADD_AT', atMs: 90000 } );
		// Position 3 is taken by the existing 'Chapter 3', so the number walks
		// on rather than duplicating it — but it never lands on the old
		// count+1 ('Chapter 5') by construction.
		expect( session.chapters.map( chapter => chapter.title ) ).toEqual( [
			'Chapter 1',
			'Chapter 2',
			'Chapter 5',
			'Chapter 3',
			'Chapter 4',
		] );

		// With titles of their own, the insertion reads in position order.
		const titled = load(
			[
				{ startAtSeconds: 0, title: 'Intro' },
				{ startAtSeconds: 60, title: 'Body' },
				{ startAtSeconds: 120, title: 'Demo' },
				{ startAtSeconds: 180, title: 'Outro' },
			],
			240000
		);
		expect(
			reduce( titled, { type: 'ADD_AT', atMs: 90000 } ).chapters.map( chapter => chapter.title )
		).toEqual( [ 'Intro', 'Body', 'Chapter 3', 'Demo', 'Outro' ] );
	} );

	it( 'never reuses a number already used as a title after a removal', () => {
		let session = load( [ { startAtSeconds: 0, title: 'Chapter 1' } ], 240000 );
		session = reduce( session, { type: 'ADD_AT', atMs: 60000 } );
		session = reduce( session, { type: 'ADD_AT', atMs: 120000 } );
		expect( session.chapters.map( chapter => chapter.title ) ).toEqual( [
			'Chapter 1',
			'Chapter 2',
			'Chapter 3',
		] );

		// Removing the middle one drops the count; the next default must not
		// fall back onto the surviving 'Chapter 3'.
		session = reduce( session, { type: 'REMOVE', id: session.chapters[ 1 ].id } );
		session = reduce( session, { type: 'ADD_AT', atMs: 180000 } );
		const titles = session.chapters.map( chapter => chapter.title );
		expect( new Set( titles ).size ).toBe( titles.length );
		expect( titles ).toEqual( [ 'Chapter 1', 'Chapter 3', 'Chapter 4' ] );
		assertInvariants( session );
	} );

	it( 'normalizes an explicit title to a single line', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'ADD_AT', atMs: 45000, title: ' My\nchapter ' } );
		expect( session.chapters[ 2 ].title ).toBe( 'My chapter' );
	} );

	it( 'falls back to the default title when the explicit title is blank', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'ADD_AT', atMs: 45000, title: ' \n ' } );
		expect( session.chapters[ 2 ].title ).toBe( 'Chapter 3' );
	} );

	it( 'is a no-op (same reference) within the dedupe radius of an existing start', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'ADD_AT', atMs: 30000 + ADD_DEDUPE_MS - 1 } ) ).toBe( base );
		expect( reduce( base, { type: 'ADD_AT', atMs: 30000 - ADD_DEDUPE_MS + 1 } ) ).toBe( base );
	} );

	it( 'adds at the boundary just outside the dedupe radius', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'ADD_AT', atMs: 30000 + ADD_DEDUPE_MS } );
		expect( session ).not.toBe( base );
		expect( session.chapters.map( chapter => chapter.startMs ) ).toContain( 31000 );
	} );

	it( 'is a no-op when the rounded second is taken by a raw mid-drag start', () => {
		const base = threeChapters();
		const midDrag = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 10600,
		} );
		// 11400 is outside the 500ms radius of 10600, but both round to 11s.
		expect( reduce( midDrag, { type: 'ADD_AT', atMs: 11400 } ) ).toBe( midDrag );
	} );

	it( 'caps the target inside the last-chapter window MOVE_START enforces', () => {
		// Whole-second duration: adding at the End must not land ON the
		// video end (zero-width segment, zero-length final cue).
		const wholeSecond = load( [ { startAtSeconds: 0, title: 'A' } ], 60000 );
		const atEnd = reduce( wholeSecond, { type: 'ADD_AT', atMs: 60000 } );
		expect( atEnd.chapters[ 1 ].startMs ).toBe( 60000 - CHAPTER_MIN_GAP_MS );

		// Fractional duration: duration − gap floors to a whole second.
		const fractional = load( [ { startAtSeconds: 0, title: 'A' } ], 60400 );
		const session = reduce( fractional, { type: 'ADD_AT', atMs: 60400 } );
		expect( session.chapters[ 1 ].startMs ).toBe( 59000 );
	} );

	it( 'canAddChapterAt mirrors the dedupe rules', () => {
		const base = threeChapters();
		expect( canAddChapterAt( base, 30200 ) ).toBe( false );
		expect( canAddChapterAt( base, 45000 ) ).toBe( true );
	} );
} );

describe( 'MOVE_START', () => {
	it( 'moves a chapter within its neighbor window', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45000,
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( 45000 );
		expect( session.selectedId ).toBe( base.selectedId );
		assertInvariants( session );
	} );

	it( 'accepts raw sub-second ms so drags can track the pointer', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45123,
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( 45123 );
	} );

	it( 'rounds fractional input to integer ms', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 44999.6,
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( 45000 );
	} );

	it( 'clamps to the previous start plus the minimum gap', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 200,
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( CHAPTER_MIN_GAP_MS );
	} );

	it( 'clamps to the next start minus the minimum gap', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 59900,
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( 60000 - CHAPTER_MIN_GAP_MS );
	} );

	it( 'clamps the last chapter to the duration minus the minimum gap', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 2 ].id,
			startMs: 95000,
		} );
		expect( session.chapters[ 2 ].startMs ).toBe( 90000 - CHAPTER_MIN_GAP_MS );
	} );

	it( 'never moves the pinned first chapter', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'MOVE_START', id: base.chapters[ 0 ].id, startMs: 5000 } ) ).toBe(
			base
		);
	} );

	it( 'is a no-op for an unknown id or an unchanged position', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'MOVE_START', id: 'nope', startMs: 45000 } ) ).toBe( base );
		expect(
			reduce( base, { type: 'MOVE_START', id: base.chapters[ 1 ].id, startMs: 30000 } )
		).toBe( base );
	} );

	it( 'is a no-op when loaded data leaves no valid window', () => {
		// Two chapters share a start: the window [1000, -1000] is degenerate.
		const base = load(
			[
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 0, title: 'B' },
				{ startAtSeconds: 1, title: 'C' },
			],
			60000
		);
		expect( reduce( base, { type: 'MOVE_START', id: base.chapters[ 1 ].id, startMs: 500 } ) ).toBe(
			base
		);
	} );
} );

describe( 'QUANTIZE', () => {
	it( 'rounds raw mid-drag starts to the nearest whole second', () => {
		const base = threeChapters();
		const dragged = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45600,
		} );
		const session = reduce( dragged, { type: 'QUANTIZE' } );
		expect( session.chapters[ 1 ].startMs ).toBe( 46000 );
		assertInvariants( session );
	} );

	it( 'rounds down below the half-second', () => {
		const base = threeChapters();
		const dragged = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45400,
		} );
		expect( reduce( dragged, { type: 'QUANTIZE' } ).chapters[ 1 ].startMs ).toBe( 45000 );
	} );

	it( 'returns the same reference for an already second-granular session', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'QUANTIZE' } ) ).toBe( base );
	} );

	it( 'commits a whole second when the duration clamp is fractional', () => {
		// A 60.9s video caps the last chapter at 59900 — itself fractional.
		// round(59900) = 60000 exceeds that window, so round-then-clamp used
		// to land back on 59900 (a no-op) and keep the raw start committed.
		const base = load(
			[
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 30, title: 'B' },
			],
			60900
		);
		const dragged = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 60500,
		} );
		expect( dragged.chapters[ 1 ].startMs ).toBe( 59900 );

		const session = reduce( dragged, { type: 'QUANTIZE' } );
		expect( session.chapters[ 1 ].startMs ).toBe( 59000 );
		expect( session.chapters[ 1 ].startMs % 1000 ).toBe( 0 );
		assertInvariants( session );
		// One pass is the fixpoint.
		expect( reduce( session, { type: 'QUANTIZE' } ) ).toBe( session );
	} );

	it( 'converges adjacent raw starts in a single idempotent pass', () => {
		// Two raw siblings: the ascending pass quantizes chapter 1 against the
		// STILL-RAW chapter 2 (raw ceiling 31600 − 1000 = 30600, grid ceiling
		// 30000), then chapter 2 against the already-quantized chapter 1.
		const base = threeChapters();
		const one = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 30600,
		} );
		const two = reduce( one, {
			type: 'MOVE_START',
			id: base.chapters[ 2 ].id,
			startMs: 31600,
		} );
		expect( two.chapters.map( chapter => chapter.startMs ) ).toEqual( [ 0, 30600, 31600 ] );

		const session = reduce( two, { type: 'QUANTIZE' } );
		expect( session.chapters.map( chapter => chapter.startMs ) ).toEqual( [ 0, 30000, 32000 ] );
		for ( const chapter of session.chapters ) {
			expect( chapter.startMs % 1000 ).toBe( 0 );
		}
		assertInvariants( session );
		expect( reduce( session, { type: 'QUANTIZE' } ) ).toBe( session );
	} );

	it( 'leaves raw starts untouched when no whole second fits the window', () => {
		// Hand-built: unreachable through actions (a whole-second predecessor
		// makes an empty grid window imply an empty raw window, which
		// MOVE_START treats as immovable) — simulates pre-fix corruption.
		// b's raw window [1000, 900] is degenerate; c's raw window
		// [2400, 2900] is fine but its grid window [3000, 2000] is empty.
		// validateRows is the save-time backstop for these leftovers.
		const session: ChaptersSession = {
			durationMs: 3900,
			chapters: [
				{ id: 'a', startMs: 0, title: 'A' },
				{ id: 'b', startMs: 1400, title: 'B' },
				{ id: 'c', startMs: 1900, title: 'C' },
			],
			selectedId: null,
		};
		expect( reduce( session, { type: 'QUANTIZE' } ) ).toBe( session );
	} );

	it( 'always commits whole seconds after a single raw drag (PRNG sweep)', () => {
		// Deterministic Park–Miller LCG (as in the round-trip suite below) so
		// failures reproduce. One raw MOVE_START per run mirrors what real
		// gestures produce: at most one fractional chapter per commit.
		let prngState = 20260710;
		const rand = () => {
			prngState = ( prngState * 16807 ) % 2147483647;
			return ( prngState - 1 ) / 2147483646;
		};
		for ( let run = 0; run < 60; run++ ) {
			// 1..999 offset keeps every duration fractional.
			const durationMs = 30000 + Math.floor( rand() * 120 ) * 1000 + 1 + Math.floor( rand() * 999 );
			const base = load(
				[
					{ startAtSeconds: 0, title: 'A' },
					{ startAtSeconds: 10, title: 'B' },
					{ startAtSeconds: 20, title: 'C' },
				],
				durationMs
			);
			const index = 1 + Math.floor( rand() * 2 );
			const dragged = reduce( base, {
				type: 'MOVE_START',
				id: base.chapters[ index ].id,
				startMs: Math.floor( rand() * ( durationMs + 2000 ) ) - 1000,
			} );
			const session = reduce( dragged, { type: 'QUANTIZE' } );
			for ( const chapter of session.chapters ) {
				expect( chapter.startMs % 1000 ).toBe( 0 );
			}
			assertInvariants( session );
			expect( reduce( session, { type: 'QUANTIZE' } ) ).toBe( session );
		}
	} );
} );

describe( 'RENAME', () => {
	it( 'strips newlines and trims like the details editor', () => {
		const base = threeChapters();
		const session = reduce( base, {
			type: 'RENAME',
			id: base.chapters[ 1 ].id,
			title: ' New\ntitle ',
		} );
		expect( session.chapters[ 1 ].title ).toBe( 'New title' );
		assertInvariants( session );
	} );

	it( 'is a no-op for the same title (after normalization) or an unknown id', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'RENAME', id: base.chapters[ 1 ].id, title: 'Middle' } ) ).toBe(
			base
		);
		expect(
			reduce( base, { type: 'RENAME', id: base.chapters[ 1 ].id, title: ' Middle\n' } )
		).toBe( base );
		expect( reduce( base, { type: 'RENAME', id: 'nope', title: 'X' } ) ).toBe( base );
	} );

	it( 'allows renaming to empty (validation flags it at save time)', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'RENAME', id: base.chapters[ 1 ].id, title: '  ' } );
		expect( session.chapters[ 1 ].title ).toBe( '' );
	} );
} );

describe( 'REMOVE', () => {
	it( 'removes a chapter and keeps an unrelated selection', () => {
		const base = threeChapters();
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 2 ].id } );
		const session = reduce( selected, { type: 'REMOVE', id: base.chapters[ 1 ].id } );
		expect( session.chapters.map( chapter => chapter.title ) ).toEqual( [ 'Intro', 'End' ] );
		expect( session.selectedId ).toBe( base.chapters[ 2 ].id );
		assertInvariants( session );
	} );

	it( 'clears the selection when the selected chapter is removed', () => {
		const base = threeChapters();
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } );
		const session = reduce( selected, { type: 'REMOVE', id: base.chapters[ 1 ].id } );
		expect( session.selectedId ).toBeNull();
	} );

	it( 're-pins the new first chapter to 0 when the first is removed', () => {
		const base = threeChapters();
		const session = reduce( base, { type: 'REMOVE', id: base.chapters[ 0 ].id } );
		expect( session.chapters[ 0 ] ).toMatchObject( {
			id: base.chapters[ 1 ].id,
			startMs: 0,
			title: 'Middle',
		} );
		expect( session.chapters[ 1 ].startMs ).toBe( 60000 );
		assertInvariants( session );
	} );

	it( 'is a no-op at one chapter or for an unknown id', () => {
		const single = load( [ { startAtSeconds: 0, title: 'Only' } ], 60000 );
		expect( reduce( single, { type: 'REMOVE', id: single.chapters[ 0 ].id } ) ).toBe( single );

		const base = threeChapters();
		expect( reduce( base, { type: 'REMOVE', id: 'nope' } ) ).toBe( base );
	} );
} );

describe( 'SELECT', () => {
	it( 'selects an existing chapter and clears with null', () => {
		const base = threeChapters();
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } );
		expect( selected.selectedId ).toBe( base.chapters[ 1 ].id );
		expect( reduce( selected, { type: 'SELECT', id: null } ).selectedId ).toBeNull();
	} );

	it( 'is a no-op for an unknown id or the current selection', () => {
		const base = threeChapters();
		expect( reduce( base, { type: 'SELECT', id: 'nope' } ) ).toBe( base );
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } );
		expect( reduce( selected, { type: 'SELECT', id: base.chapters[ 1 ].id } ) ).toBe( selected );
	} );
} );

describe( 'helpers', () => {
	it( 'chaptersEditsEqual ignores the selection but sees edits', () => {
		const base = threeChapters();
		const selected = reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } );
		expect( chaptersEditsEqual( base, selected ) ).toBe( true );

		const renamed = reduce( base, { type: 'RENAME', id: base.chapters[ 1 ].id, title: 'X' } );
		expect( chaptersEditsEqual( base, renamed ) ).toBe( false );

		const moved = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45000,
		} );
		expect( chaptersEditsEqual( base, moved ) ).toBe( false );
	} );

	it( 'chaptersToRows converts ms to integer seconds, rounding raw drags', () => {
		const base = threeChapters();
		const dragged = reduce( base, {
			type: 'MOVE_START',
			id: base.chapters[ 1 ].id,
			startMs: 45600,
		} );
		expect( chaptersToRows( dragged ) ).toEqual( [
			{ startAtSeconds: 0, title: 'Intro' },
			{ startAtSeconds: 46, title: 'Middle' },
			{ startAtSeconds: 60, title: 'End' },
		] );
	} );

	it( 'isChaptersDirty is false right after a faithful LOAD and true after edits', () => {
		const rows: ChapterRow[] = [
			{ startAtSeconds: 0, title: 'Intro' },
			{ startAtSeconds: 30, title: 'Middle' },
		];
		const base = load( rows, 60000 );
		expect( isChaptersDirty( base, rows ) ).toBe( false );

		expect( isChaptersDirty( reduce( base, { type: 'ADD_AT', atMs: 45000 } ), rows ) ).toBe( true );
		expect(
			isChaptersDirty(
				reduce( base, { type: 'RENAME', id: base.chapters[ 1 ].id, title: 'X' } ),
				rows
			)
		).toBe( true );
		expect(
			isChaptersDirty(
				reduce( base, { type: 'MOVE_START', id: base.chapters[ 1 ].id, startMs: 45000 } ),
				rows
			)
		).toBe( true );
		expect(
			isChaptersDirty( reduce( base, { type: 'REMOVE', id: base.chapters[ 1 ].id } ), rows )
		).toBe( true );

		// Selection alone never dirties.
		expect(
			isChaptersDirty( reduce( base, { type: 'SELECT', id: base.chapters[ 1 ].id } ), rows )
		).toBe( false );
	} );

	it( 'isChaptersDirty is true when LOAD had to pin a non-zero first chapter', () => {
		const rows: ChapterRow[] = [
			{ startAtSeconds: 5, title: 'Late' },
			{ startAtSeconds: 30, title: 'B' },
		];
		expect( isChaptersDirty( load( rows, 60000 ), rows ) ).toBe( true );
	} );
} );

describe( 'description round-trip', () => {
	/**
	 * Deterministic PRNG (Park–Miller LCG) so failures reproduce.
	 *
	 * @param seed - Seed value.
	 * @return A function returning floats in [0, 1).
	 */
	function parkMiller( seed: number ): () => number {
		let state = Math.abs( Math.round( seed ) ) % 2147483647;
		if ( state === 0 ) {
			state = 1;
		}
		return () => {
			state = ( state * 16807 ) % 2147483647;
			return ( state - 1 ) / 2147483646;
		};
	}

	const WORDS = [ 'Intro', 'Setup', 'Demo', 'Deep dive', 'Recap', 'Questions', 'Outro' ];
	const PROSE = [
		'Recorded at the summer summit.',
		'Thanks for watching!',
		'',
		'All feedback welcome.',
	];

	/**
	 * Generate a normalized description plus its chapter rows.
	 *
	 * @param rand - PRNG.
	 * @return The description text and the rows it contains.
	 */
	function generateDescription( rand: () => number ): { desc: string; rows: ChapterRow[] } {
		const rowCount = 1 + Math.floor( rand() * 6 );
		const rows: ChapterRow[] = [];
		let start = 0;
		for ( let i = 0; i < rowCount; i++ ) {
			const title =
				rand() < 0.15
					? ''
					: WORDS[ Math.floor( rand() * WORDS.length ) ] +
					  ( rand() < 0.3 ? ` ${ WORDS[ Math.floor( rand() * WORDS.length ) ] }` : '' );
			rows.push( { startAtSeconds: start, title } );
			start += 10 + Math.floor( rand() * 300 );
		}
		const proseLines = Array.from(
			{ length: Math.floor( rand() * 3 ) },
			() => PROSE[ Math.floor( rand() * PROSE.length ) ]
		);
		// serializeDescription appends the normalized chapter block, so the
		// generated description is normal-form by construction.
		const desc = serializeDescription( proseLines.join( '\n' ), rows );
		return { desc, rows };
	}

	it( 'LOAD → chaptersToRows → serializeDescription → parseDescription is stable', () => {
		const rand = parkMiller( 20260708 );
		for ( let run = 0; run < 40; run++ ) {
			const { desc, rows } = generateDescription( rand );
			const parsed = parseDescription( desc );
			expect( parsed.rows ).toEqual( rows );

			const durationMs = ( rows[ rows.length - 1 ].startAtSeconds + 30 ) * 1000;
			const session = load( parsed.rows, durationMs );
			assertInvariants( session );

			const roundRows = chaptersToRows( session );
			const rewritten = serializeDescription( desc, roundRows );

			// Parse stability: the rewrite parses back to exactly the rows.
			expect( parseDescription( rewritten ).rows ).toEqual( roundRows );
			// Byte identity: a normal-form description is a fixpoint.
			expect( rewritten ).toBe( desc );
			// Idempotence: a second LOAD/serialize pass changes nothing.
			const session2 = load( parseDescription( rewritten ).rows, durationMs );
			expect( serializeDescription( rewritten, chaptersToRows( session2 ) ) ).toBe( rewritten );
		}
	} );

	it( 'stays parse-stable when LOAD pins a non-zero first chapter', () => {
		const desc = 'Prose before.\n\n0:05 Late start\n1:00 Second';
		const session = load( parseDescription( desc ).rows, 120000 );
		const roundRows = chaptersToRows( session );
		expect( roundRows[ 0 ].startAtSeconds ).toBe( 0 );

		const rewritten = serializeDescription( desc, roundRows );
		expect( parseDescription( rewritten ).rows ).toEqual( roundRows );
		expect( rewritten ).toContain( 'Prose before.' );
	} );

	it( 'round-trips after a realistic edit session', () => {
		const desc = serializeDescription( 'A talk.', [
			{ startAtSeconds: 0, title: 'Intro' },
			{ startAtSeconds: 45, title: 'Demo' },
			{ startAtSeconds: 90, title: 'Outro' },
		] );
		const durationMs = 150000;
		let session = load( parseDescription( desc ).rows, durationMs );

		session = reduce( session, { type: 'ADD_AT', atMs: 120400, title: 'Credits' } );
		session = reduce( session, {
			type: 'MOVE_START',
			id: session.chapters[ 1 ].id,
			startMs: 50600,
		} );
		session = reduce( session, { type: 'QUANTIZE' } );
		session = reduce( session, {
			type: 'RENAME',
			id: session.chapters[ 2 ].id,
			title: 'Live demo',
		} );
		assertInvariants( session );

		const rows = chaptersToRows( session );
		expect( rows ).toEqual( [
			{ startAtSeconds: 0, title: 'Intro' },
			{ startAtSeconds: 51, title: 'Demo' },
			{ startAtSeconds: 90, title: 'Live demo' },
			{ startAtSeconds: 120, title: 'Credits' },
		] );

		const rewritten = serializeDescription( desc, rows );
		expect( parseDescription( rewritten ).rows ).toEqual( rows );
		expect( rewritten ).toContain( 'A talk.' );
	} );
} );
