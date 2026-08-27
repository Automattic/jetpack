import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * Stands in for the preferences store's own state. Importing the real store pulls the
 * whole `@wordpress/components` tree in behind it, and what matters here is the payload
 * the module reads and writes, not how the store keeps it.
 */
const stored = new Map();

const keyFor = ( scope, key ) => `${ scope }::${ key }`;

await jest.unstable_mockModule( '@wordpress/preferences', () => ( {
	store: { name: 'core/preferences' },
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: () => ( {
		get: ( scope, key ) => stored.get( keyFor( scope, key ) ),
	} ),
	dispatch: () => ( {
		set: ( scope, key, value ) => stored.set( keyFor( scope, key ), value ),
	} ),
} ) );

const { getColumnPreferenceKey, readKnownAnswerIds, writeKnownAnswerIds } = await import(
	'../response-column-preferences.ts'
);

const SCOPE = 'jetpack/forms';
const KNOWN_IDS = [ 'field:g5-name', 'field:g5-email' ];

/**
 * Writes a raw payload, standing in for a record left by an older release.
 *
 * @param {number|null} formId  - The form the record belongs to.
 * @param {unknown}     payload - What to store.
 * @return {Map} The updated store map.
 */
const storeRaw = ( formId, payload ) =>
	stored.set( keyFor( SCOPE, getColumnPreferenceKey( formId ) ), payload );

afterEach( () => {
	stored.clear();
} );

describe( 'getColumnPreferenceKey', () => {
	it( 'keys a form by its id and the every-form view by name', () => {
		expect( getColumnPreferenceKey( 5 ) ).toBe( 'response-columns/5' );
		expect( getColumnPreferenceKey( null ) ).toBe( 'response-columns/all' );
	} );
} );

describe( 'readKnownAnswerIds', () => {
	it( 'reads back what was written, for that form only', () => {
		writeKnownAnswerIds( 5, KNOWN_IDS );

		expect( readKnownAnswerIds( 5 ) ).toEqual( KNOWN_IDS );
		// Another form's answer columns are its own; nothing leaks across.
		expect( readKnownAnswerIds( 6 ) ).toBeNull();
		expect( readKnownAnswerIds( null ) ).toBeNull();
	} );

	it( 'writes into the preferences scope, where the view is kept too', () => {
		writeKnownAnswerIds( 5, KNOWN_IDS );

		expect( stored.get( keyFor( SCOPE, 'response-columns/5' ) ) ).toEqual( {
			v: 2,
			knownAnswerIds: KNOWN_IDS,
		} );
	} );

	it( 'reports no record when none was ever written', () => {
		expect( readKnownAnswerIds( 5 ) ).toBeNull();
	} );

	it( 're-offers every column rather than trusting a damaged record', () => {
		storeRaw( 5, null );
		expect( readKnownAnswerIds( 5 ) ).toBeNull();

		storeRaw( 5, { v: 2, knownAnswerIds: 'field:g5-name' } );
		expect( readKnownAnswerIds( 5 ) ).toBeNull();
	} );

	it( 'discards a record written under a different schema', () => {
		// The record is what keeps a hidden column hidden, so a change to its shape must
		// not be read through older eyes. Refusing it costs one re-shown column.
		storeRaw( 5, { knownAnswerIds: KNOWN_IDS } );
		expect( readKnownAnswerIds( 5 ) ).toBeNull();

		// The localStorage shape this replaced, which carried `fields` as well.
		storeRaw( 5, { v: 1, fields: [ 'date' ], knownAnswerIds: KNOWN_IDS } );
		expect( readKnownAnswerIds( 5 ) ).toBeNull();

		storeRaw( 5, { v: 99, knownAnswerIds: KNOWN_IDS } );
		expect( readKnownAnswerIds( 5 ) ).toBeNull();
	} );

	it( 'drops entries that are not column ids', () => {
		storeRaw( 5, { v: 2, knownAnswerIds: [ 'field:g5-name', 7, null, 'field:g5-email' ] } );

		expect( readKnownAnswerIds( 5 ) ).toEqual( KNOWN_IDS );
	} );
} );
