import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
	getColumnPreferenceKey,
	readColumnPreference,
	writeColumnPreference,
} from '../response-column-preferences.ts';

const PREFERENCE = {
	fields: [ 'date', 'field:g5-name', 'source' ],
	knownAnswerIds: [ 'field:g5-name', 'field:g5-email' ],
};

afterEach( () => {
	window.localStorage.clear();
	jest.restoreAllMocks();
} );

describe( 'getColumnPreferenceKey', () => {
	it( 'keys a form by its id and the every-form view by name', () => {
		expect( getColumnPreferenceKey( 5 ) ).toBe( 'jetpack-forms/response-columns/5' );
		expect( getColumnPreferenceKey( null ) ).toBe( 'jetpack-forms/response-columns/all' );
	} );
} );

describe( 'readColumnPreference', () => {
	it( 'reads back what was written, for that form only', () => {
		writeColumnPreference( 5, PREFERENCE );

		expect( readColumnPreference( 5 ) ).toEqual( PREFERENCE );
		// Another form's columns are its own; nothing leaks across.
		expect( readColumnPreference( 6 ) ).toBeNull();
		expect( readColumnPreference( null ) ).toBeNull();
	} );

	it( 'reports no choice when none was ever made', () => {
		expect( readColumnPreference( 5 ) ).toBeNull();
	} );

	it( 'falls back to the defaults rather than trusting a damaged entry', () => {
		// A hand-edited or half-written entry must not render a broken table.
		window.localStorage.setItem( getColumnPreferenceKey( 5 ), '{ not json' );
		expect( readColumnPreference( 5 ) ).toBeNull();

		window.localStorage.setItem(
			getColumnPreferenceKey( 5 ),
			JSON.stringify( { fields: 'date' } )
		);
		expect( readColumnPreference( 5 ) ).toBeNull();

		window.localStorage.setItem( getColumnPreferenceKey( 5 ), 'null' );
		expect( readColumnPreference( 5 ) ).toBeNull();
	} );

	it( 'drops entries that are not column ids, and tolerates a missing known list', () => {
		window.localStorage.setItem(
			getColumnPreferenceKey( 5 ),
			JSON.stringify( { v: 1, fields: [ 'date', 7, null, 'ip' ] } )
		);

		expect( readColumnPreference( 5 ) ).toEqual( {
			fields: [ 'date', 'ip' ],
			knownAnswerIds: [],
		} );
	} );

	it( 'discards a choice written under a different schema', () => {
		// A stored choice replaces the default columns wholesale, so a later change to
		// what those defaults are would never reach anyone holding an older one. Refusing
		// to read it is what lets such a change land.
		window.localStorage.setItem(
			getColumnPreferenceKey( 5 ),
			JSON.stringify( { fields: [ 'date' ], knownAnswerIds: [] } )
		);
		expect( readColumnPreference( 5 ) ).toBeNull();

		window.localStorage.setItem(
			getColumnPreferenceKey( 5 ),
			JSON.stringify( { v: 99, fields: [ 'date' ], knownAnswerIds: [] } )
		);
		expect( readColumnPreference( 5 ) ).toBeNull();
	} );

	it( 'reports no choice when storage itself throws', () => {
		// A private window or a browser set to block site data raises here rather than
		// returning empty, and the dashboard has to keep working.
		jest.spyOn( window.localStorage.__proto__, 'getItem' ).mockImplementation( () => {
			throw new Error( 'SecurityError' );
		} );

		expect( readColumnPreference( 5 ) ).toBeNull();
	} );
} );

describe( 'writeColumnPreference', () => {
	it( 'swallows a storage failure, because a column layout is not worth an error', () => {
		jest.spyOn( window.localStorage.__proto__, 'setItem' ).mockImplementation( () => {
			throw new Error( 'QuotaExceededError' );
		} );

		expect( () => writeColumnPreference( 5, PREFERENCE ) ).not.toThrow();
	} );
} );
