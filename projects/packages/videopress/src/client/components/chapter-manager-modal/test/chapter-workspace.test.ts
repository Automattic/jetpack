/**
 * Internal dependencies
 */
import {
	canSaveChapters,
	chapterWorkspaceReducer,
	getChapterValidationErrors,
	hasUnsavedChapterEdits,
	initialChapterWorkspaceState,
} from '../chapter-workspace';
import type { ChapterRow, ChapterWorkspaceState } from '../chapter-workspace';

const seed = ( chapters: Array< { seconds: number; title: string } > ): ChapterWorkspaceState =>
	chapterWorkspaceReducer( initialChapterWorkspaceState, { type: 'SEED', chapters } );

const VALID = [
	{ seconds: 0, title: 'Intro' },
	{ seconds: 84, title: 'Middle' },
	{ seconds: 184, title: 'End' },
];

describe( 'chapterWorkspaceReducer', () => {
	it( 'seeds rows with ids and a clean baseline', () => {
		const state = seed( VALID );
		expect( state.rows ).toHaveLength( 3 );
		expect( state.rows.map( row => row.title ) ).toEqual( [ 'Intro', 'Middle', 'End' ] );
		expect( hasUnsavedChapterEdits( state ) ).toBe( false );
		expect( state.hadChapters ).toBe( true );
	} );

	it( 'keeps rows sorted by seconds after SET_TIME', () => {
		const state = seed( VALID );
		const middleId = state.rows[ 1 ].id;
		const next = chapterWorkspaceReducer( state, {
			type: 'SET_TIME',
			id: middleId,
			seconds: 300,
		} );
		expect( next.rows.map( row => row.title ) ).toEqual( [ 'Intro', 'End', 'Middle' ] );
		expect( hasUnsavedChapterEdits( next ) ).toBe( true );
	} );

	it( 'ADD_ROW on an empty workspace pins a 0:00 row first', () => {
		const state = chapterWorkspaceReducer( seed( [] ), { type: 'ADD_ROW', seconds: 42 } );
		expect( state.rows.map( row => row.seconds ) ).toEqual( [ 0, 42 ] );
	} );

	it( 'REMOVE_ROW removes by id and MARK_SAVED cleans the dirty flag', () => {
		const state = seed( VALID );
		const removed = chapterWorkspaceReducer( state, {
			type: 'REMOVE_ROW',
			id: state.rows[ 2 ].id,
		} );
		expect( removed.rows ).toHaveLength( 2 );
		expect( hasUnsavedChapterEdits( removed ) ).toBe( true );
		const saved = chapterWorkspaceReducer( removed, { type: 'MARK_SAVED' } );
		expect( hasUnsavedChapterEdits( saved ) ).toBe( false );
	} );
} );

describe( 'getChapterValidationErrors', () => {
	const rows = ( entries: Array< [ number, string ] > ): ChapterRow[] =>
		entries.map( ( [ seconds, title ], index ) => ( { id: index + 1, seconds, title } ) );

	it( 'passes a valid set', () => {
		expect(
			getChapterValidationErrors(
				rows( [
					[ 0, 'A' ],
					[ 30, 'B' ],
					[ 60, 'C' ],
				] )
			)
		).toEqual( [] );
	} );

	it( 'flags a non-zero first chapter', () => {
		expect(
			getChapterValidationErrors(
				rows( [
					[ 5, 'A' ],
					[ 30, 'B' ],
					[ 60, 'C' ],
				] )
			)
		).toEqual( expect.arrayContaining( [ { code: 'start-at-zero' } ] ) );
	} );

	it( 'flags fewer than three chapters', () => {
		expect(
			getChapterValidationErrors(
				rows( [
					[ 0, 'A' ],
					[ 30, 'B' ],
				] )
			)
		).toEqual( expect.arrayContaining( [ { code: 'min-count' } ] ) );
	} );

	it( 'flags the later row of a too-small gap', () => {
		const errors = getChapterValidationErrors(
			rows( [
				[ 0, 'A' ],
				[ 5, 'B' ],
				[ 60, 'C' ],
			] )
		);
		expect( errors ).toEqual( expect.arrayContaining( [ { code: 'gap', rowId: 2 } ] ) );
	} );

	it( 'flags empty titles per row', () => {
		const errors = getChapterValidationErrors(
			rows( [
				[ 0, 'A' ],
				[ 30, ' ' ],
				[ 60, 'C' ],
			] )
		);
		expect( errors ).toEqual( expect.arrayContaining( [ { code: 'empty-title', rowId: 2 } ] ) );
	} );

	it( 'reports nothing for an empty list', () => {
		expect( getChapterValidationErrors( [] ) ).toEqual( [] );
	} );
} );

describe( 'canSaveChapters', () => {
	it( 'requires dirty state', () => {
		expect( canSaveChapters( seed( VALID ) ) ).toBe( false );
	} );

	it( 'allows saving a dirty valid set', () => {
		const state = seed( VALID );
		const next = chapterWorkspaceReducer( state, {
			type: 'SET_TITLE',
			id: state.rows[ 0 ].id,
			title: 'New intro',
		} );
		expect( canSaveChapters( next ) ).toBe( true );
	} );

	it( 'blocks saving an invalid non-empty set', () => {
		const state = seed( VALID );
		const next = chapterWorkspaceReducer( state, {
			type: 'REMOVE_ROW',
			id: state.rows[ 2 ].id,
		} );
		expect( canSaveChapters( next ) ).toBe( false );
	} );

	it( 'allows saving an emptied workspace only when chapters existed before', () => {
		let state = seed( VALID );
		for ( const row of [ ...state.rows ] ) {
			state = chapterWorkspaceReducer( state, { type: 'REMOVE_ROW', id: row.id } );
		}
		expect( canSaveChapters( state ) ).toBe( true );
		expect( canSaveChapters( seed( [] ) ) ).toBe( false );
	} );
} );
