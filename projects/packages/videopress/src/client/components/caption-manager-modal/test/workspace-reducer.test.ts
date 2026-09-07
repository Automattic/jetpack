/**
 * Internal dependencies
 */
import {
	hasUnsavedManualEdits,
	initialWorkspaceState,
	workspaceReducer,
} from '../workspace-reducer';
/**
 * Types
 */
import type { CaptionCueBlock } from '../track-helpers';
import type { ManualWorkspace, WorkspaceState } from '../workspace-reducer';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( 'debug', () => () => jest.fn() );
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
	sprintf: ( text: string ) => text,
} ) );
jest.mock( '@wordpress/blocks', () => {
	let blockId = 0;
	return {
		createBlock: ( name: string, attributes: Record< string, string > ) => ( {
			name,
			attributes,
			clientId: `block-${ ++blockId }`,
		} ),
		parse: jest.fn( () => [] ),
		serialize: jest.fn( () => '' ),
	};
} );

const cueBlock = ( text: string, startTime = '00:00:00.000', endTime = '00:00:02.000' ) =>
	( {
		name: 'videopress/caption-cue',
		attributes: { startTime, endTime, text },
		clientId: `cue-${ text }`,
	} ) as unknown as CaptionCueBlock;

const openManual = (
	state: WorkspaceState,
	{
		requestId = 1,
		cueBlocks = [ cueBlock( 'seeded' ) ],
		isLoadingContent = false,
	}: {
		requestId?: number;
		cueBlocks?: CaptionCueBlock[];
		isLoadingContent?: boolean;
	} = {}
): ManualWorkspace =>
	workspaceReducer( state, {
		type: 'OPEN_MANUAL',
		requestId,
		track: { kind: 'subtitles', srcLang: 'en', label: 'English' },
		sourceTrack: null,
		captionTrackId: undefined,
		cueBlocks,
		isLoadingContent,
	} ) as ManualWorkspace;

describe( 'workspaceReducer', () => {
	it( 'opens the manual editor with baselines matching the seed', () => {
		const seed = [ cueBlock( 'seeded' ) ];
		const state = openManual( initialWorkspaceState, { cueBlocks: seed } );

		expect( state.view ).toBe( 'manual' );
		expect( state.cueBlocks ).toBe( seed );
		expect( state.trackBaseline ).toEqual( { srcLang: 'en', label: 'English' } );
		expect( hasUnsavedManualEdits( state, seed ) ).toBe( false );
	} );

	it( 'drops async continuations that carry a stale requestId', () => {
		const state = openManual( initialWorkspaceState, { requestId: 2, isLoadingContent: true } );

		const next = workspaceReducer( state, {
			type: 'SEED_CUE_BLOCKS',
			requestId: 1,
			cueBlocks: [ cueBlock( 'stale' ) ],
		} );

		expect( next ).toBe( state );
	} );

	it( 'seeds loaded content and re-baselines on it', () => {
		const state = openManual( initialWorkspaceState, { isLoadingContent: true } );
		const loaded = [ cueBlock( 'loaded' ) ];

		const next = workspaceReducer( state, {
			type: 'SEED_CUE_BLOCKS',
			requestId: 1,
			cueBlocks: loaded,
		} ) as ManualWorkspace;

		expect( next.cueBlocks ).toBe( loaded );
		expect( next.isLoadingContent ).toBe( false );
		expect( hasUnsavedManualEdits( next, loaded ) ).toBe( false );
	} );

	it( 'moves the baseline on MARK_SAVED without re-seeding the editor', () => {
		const state = openManual( initialWorkspaceState );
		const editedBlocks = [ cueBlock( 'edited' ) ];
		expect( hasUnsavedManualEdits( state, editedBlocks ) ).toBe( true );

		const next = workspaceReducer( state, {
			type: 'MARK_SAVED',
			requestId: 1,
			captionTrackId: 7,
			cueBlocks: editedBlocks,
		} ) as ManualWorkspace;

		expect( next.captionTrackId ).toBe( 7 );
		// The seed is untouched: replacing it would revert typing done mid-save.
		expect( next.cueBlocks ).toBe( state.cueBlocks );
		expect( hasUnsavedManualEdits( next, editedBlocks ) ).toBe( false );
	} );

	it( 'keeps edits made while a save was in flight dirty', () => {
		const state = openManual( initialWorkspaceState );
		const savedBlocks = [ cueBlock( 'saved' ) ];
		const typedAfterSave = [ cueBlock( 'saved' ), cueBlock( 'typed later' ) ];

		const next = workspaceReducer( state, {
			type: 'MARK_SAVED',
			requestId: 1,
			captionTrackId: 7,
			cueBlocks: savedBlocks,
		} );

		expect( hasUnsavedManualEdits( next, typedAfterSave ) ).toBe( true );
	} );

	it( 'appends imported cues to the live blocks, dropping empty placeholders', () => {
		const state = openManual( initialWorkspaceState );
		const liveBlocks = [ cueBlock( 'kept' ), cueBlock( '' ) ];
		const imported = [ cueBlock( 'imported' ) ];

		const next = workspaceReducer( state, {
			type: 'IMPORT_CUES',
			mode: 'append',
			cueBlocks: imported,
			currentCueBlocks: liveBlocks,
		} ) as ManualWorkspace;

		expect( next.cueBlocks.map( block => block.attributes.text ) ).toEqual( [
			'kept',
			'imported',
		] );
		expect( next.isTextImportOpen ).toBe( false );
		expect( next.textImportValue ).toBe( '' );
	} );

	it( 'replaces the live blocks on a replace import', () => {
		const state = openManual( initialWorkspaceState );
		const imported = [ cueBlock( 'imported' ) ];

		const next = workspaceReducer( state, {
			type: 'IMPORT_CUES',
			mode: 'replace',
			cueBlocks: imported,
			currentCueBlocks: [ cueBlock( 'kept' ) ],
		} ) as ManualWorkspace;

		expect( next.cueBlocks ).toBe( imported );
	} );

	it( 'clears the pasted text when the import panel closes', () => {
		let state: WorkspaceState = openManual( initialWorkspaceState );
		state = workspaceReducer( state, { type: 'SET_TEXT_IMPORT_OPEN', isOpen: true } );
		state = workspaceReducer( state, { type: 'SET_TEXT_IMPORT_VALUE', value: 'pasted' } );

		const next = workspaceReducer( state, {
			type: 'SET_TEXT_IMPORT_OPEN',
			isOpen: false,
		} ) as ManualWorkspace;

		expect( next.textImportValue ).toBe( '' );
	} );

	it( 'ignores view-specific actions dispatched in another view', () => {
		expect(
			workspaceReducer( initialWorkspaceState, { type: 'SET_UPLOAD_FILE', file: null } )
		).toBe( initialWorkspaceState );
		expect(
			workspaceReducer( initialWorkspaceState, {
				type: 'IMPORT_CUES',
				mode: 'replace',
				cueBlocks: [],
				currentCueBlocks: [],
			} )
		).toBe( initialWorkspaceState );
	} );

	it( 'resets to the track list', () => {
		const state = openManual( initialWorkspaceState );
		expect( workspaceReducer( state, { type: 'RESET', requestId: 2 } ) ).toEqual( {
			view: 'tracks',
			requestId: 2,
		} );
	} );
} );

describe( 'hasUnsavedManualEdits', () => {
	it( 'is false outside the manual editor', () => {
		expect( hasUnsavedManualEdits( initialWorkspaceState, [ cueBlock( 'any' ) ] ) ).toBe( false );
	} );

	it( 'is true while the paste panel holds text', () => {
		let state: WorkspaceState = openManual( initialWorkspaceState );
		state = workspaceReducer( state, { type: 'SET_TEXT_IMPORT_VALUE', value: 'pasted' } );

		expect( hasUnsavedManualEdits( state, ( state as ManualWorkspace ).cueBlocks ) ).toBe( true );
	} );

	it( 'is true when the language differs from its baseline', () => {
		let state: WorkspaceState = openManual( initialWorkspaceState );
		state = workspaceReducer( state, {
			type: 'SET_MANUAL_LANGUAGE',
			srcLang: 'de',
			label: 'German',
		} );

		expect( hasUnsavedManualEdits( state, ( state as ManualWorkspace ).cueBlocks ) ).toBe( true );
	} );

	it( 'compares live blocks by content, not identity', () => {
		const state = openManual( initialWorkspaceState, { cueBlocks: [ cueBlock( 'same' ) ] } );

		// A different array with identical cue content is not an edit.
		expect( hasUnsavedManualEdits( state, [ cueBlock( 'same' ) ] ) ).toBe( false );
		expect( hasUnsavedManualEdits( state, [ cueBlock( 'different' ) ] ) ).toBe( true );
	} );
} );
