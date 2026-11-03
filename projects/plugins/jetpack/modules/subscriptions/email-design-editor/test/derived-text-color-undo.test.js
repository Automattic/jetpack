/**
 * Drives the real core-data store: what undo does to a record depends on how core-data records
 * an edit, which a mock can only assert the shape of.
 */

// Mocked because the real package resolves core's private APIs at module scope, which throws in
// jsdom. Only its store name is needed here.
jest.mock( '@woocommerce/email-editor', () => ( { storeName: 'email-editor/editor' } ) );

import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { watchDerivedTextColor } from '../src/derived-text-color';

const GRAY = '#bbbbbb';
const GRAY_TEXT = '#262626';
const BLACK_TEXT = '#f2f2f2';

let id = 0;
let stopWatching;

/**
 * Put a stored design in the store and start watching it.
 *
 * Each case gets its own record, because the registry behind these is module state that every
 * case in the file shares -- including the edits a previous one left pending.
 *
 * @param {object} stored - The design's stored `styles`.
 * @return {void}
 */
function open( stored ) {
	id += 1;

	dispatch( coreStore ).receiveEntityRecords(
		'root',
		'globalStyles',
		[ { id, styles: stored, settings: {} } ],
		undefined,
		false
	);

	stopWatching = watchDerivedTextColor( id );
}

/**
 * The design as the editor sees it: what is stored, plus anything unsaved.
 *
 * @return {object} The edited record's `styles`.
 */
function styles() {
	return select( coreStore ).getEditedEntityRecord( 'root', 'globalStyles', id ).styles;
}

/**
 * Whether the record holds anything unsaved.
 *
 * @return {boolean} True when there are pending edits.
 */
function isDirty() {
	return select( coreStore ).hasEditsForEntityRecord( 'root', 'globalStyles', id );
}

/**
 * Change the background the way the Styles panel does, replacing `styles` wholesale.
 *
 * @param {string} background - The new background.
 * @return {void}
 */
function pickBackground( background ) {
	dispatch( coreStore ).editEntityRecord( 'root', 'globalStyles', id, {
		styles: { ...styles(), color: { ...styles().color, background } },
	} );
}

afterEach( () => stopWatching?.() );

describe( 'watchDerivedTextColor against core-data', () => {
	it( 'derives into the record the panel and the save both read', () => {
		open( { color: { background: GRAY } } );

		pickBackground( '#000000' );

		expect( styles() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );
		expect( isDirty() ).toBe( true );
	} );

	// The seed is read when the watcher starts, so this pick is a change rather than the baseline.
	// Nothing else has touched the store, which is what a lazier seed would have swallowed.
	it( 'derives from the first pick, with no store activity before it', () => {
		open( {} );

		pickBackground( '#000000' );

		expect( styles().color.text ).toBe( BLACK_TEXT );
	} );

	// The background's own undo record carries the whole `styles` object as it stood before the
	// pick, so restoring it takes the derived text with it.
	it( 'restores the record exactly on one undo', async () => {
		const stored = { color: { background: GRAY } };
		open( stored );

		pickBackground( '#000000' );
		expect( styles() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );

		await dispatch( coreStore ).undo();

		expect( styles() ).toEqual( stored );
		expect( isDirty() ).toBe( false );
	} );

	it( 'restores a text color the creator had set, rather than a derivation of it', async () => {
		const stored = { color: { background: GRAY, text: '#ff6600' } };
		open( stored );

		pickBackground( '#000000' );
		expect( styles().color.text ).toBe( '#ff6600' );

		await dispatch( coreStore ).undo();

		expect( styles() ).toEqual( stored );
		expect( isDirty() ).toBe( false );
	} );

	it( 're-derives across a chain of picks, and unwinds it one press at a time', async () => {
		open( {} );

		pickBackground( '#000000' );
		expect( styles().color.text ).toBe( BLACK_TEXT );

		pickBackground( GRAY );
		expect( styles().color.text ).toBe( GRAY_TEXT );

		await dispatch( coreStore ).undo();
		expect( styles() ).toEqual( { color: { background: '#000000', text: BLACK_TEXT } } );

		await dispatch( coreStore ).undo();
		expect( styles() ).toEqual( {} );
		expect( isDirty() ).toBe( false );
	} );
} );
