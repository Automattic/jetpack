import { act, renderHook } from '@testing-library/react';
import { usePersistedView } from '../use-persisted-view';
import type { View } from '@wordpress/dataviews';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
} ) );

const STORAGE_KEY = 'jetpack-videopress-preferences-123-7';
const SCOPE = 'jetpack/videopress';
const NAME = 'libraryView';

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	fields: [],
	sort: { field: 'uploadDate', direction: 'desc' },
	filters: [],
	search: '',
};

/**
 * Seed localStorage with a persisted library view under the preferences shape.
 *
 * @param libraryView - The raw value to store under the library-view preference.
 */
function seedStorage( libraryView: unknown ) {
	window.localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify( { [ SCOPE ]: { [ NAME ]: libraryView } } )
	);
}

describe( 'usePersistedView', () => {
	beforeEach( () => {
		window.localStorage.clear();
		jest.resetModules();
	} );

	it( 'falls back to the default view when nothing is persisted', () => {
		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ initialView ] = result.current;
		expect( initialView.type ).toBe( 'grid' );
		expect( initialView.page ).toBe( 1 );
	} );

	it( 'hydrates a valid persisted view over the default', () => {
		seedStorage( {
			type: 'table',
			fields: [ 'filename', 'duration' ],
			perPage: 24,
			sort: { field: 'title', direction: 'asc' },
			layout: { density: 'balanced' },
		} );

		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ initialView ] = result.current;

		expect( initialView.type ).toBe( 'table' );
		expect( initialView.fields ).toEqual( [ 'filename', 'duration' ] );
		expect( initialView.perPage ).toBe( 24 );
		expect( initialView.sort ).toEqual( { field: 'title', direction: 'asc' } );
	} );

	it( 'always resets page to 1 and clears search on hydrate', () => {
		seedStorage( { type: 'table', page: 5, search: 'stale-term' } );

		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ initialView ] = result.current;

		expect( initialView.page ).toBe( 1 );
		expect( initialView.search ).toBe( '' );
	} );

	it( 'drops unknown fields and an invalid type, falling back to defaults', () => {
		seedStorage( {
			type: 'not-a-real-type',
			fields: [ 'filename', 'totally-made-up-field' ],
		} );

		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ initialView ] = result.current;

		// Invalid type ignored -> default 'grid'.
		expect( initialView.type ).toBe( 'grid' );
		// `fields` array contains an unknown id, so the whole array is rejected
		// in favour of the default empty array.
		expect( initialView.fields ).toEqual( [] );
	} );

	it( 'persists only the whitelisted subset back to storage', () => {
		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ , persistView ] = result.current;

		act( () => {
			persistView( {
				...DEFAULT_VIEW,
				type: 'table',
				fields: [ 'filename' ],
				perPage: 48,
				page: 9,
				search: 'should-not-persist',
			} );
		} );

		const stored = JSON.parse( window.localStorage.getItem( STORAGE_KEY ) as string );
		const persisted = stored[ SCOPE ][ NAME ];

		expect( persisted.type ).toBe( 'table' );
		expect( persisted.fields ).toEqual( [ 'filename' ] );
		expect( persisted.perPage ).toBe( 48 );
		// search and page are not part of the persisted whitelist.
		expect( persisted.search ).toBeUndefined();
		expect( persisted.page ).toBeUndefined();
	} );
} );
