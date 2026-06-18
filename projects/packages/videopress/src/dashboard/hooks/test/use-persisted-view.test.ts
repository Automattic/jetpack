import { act, renderHook } from '@testing-library/react';
import { usePersistedView } from '../use-persisted-view';
import type { View } from '@wordpress/dataviews';

// Mutable so individual tests can exercise different site shapes (e.g. a
// disconnected site whose `blog_id` is 0).
let mockScriptData: unknown = {
	site: { wpcom: { blog_id: 123 } },
	user: { current_user: { id: 7 } },
};

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => mockScriptData,
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
		mockScriptData = {
			site: { wpcom: { blog_id: 123 } },
			user: { current_user: { id: 7 } },
		};
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

	it( 'scopes storage by host when blog_id is 0 (disconnected site)', () => {
		// A disconnected site's `blog_id` defaults to 0; `??` would treat that
		// as a real id and collapse every disconnected site onto one key. The
		// key should fall back to the host so different sites stay separate.
		mockScriptData = {
			site: { wpcom: { blog_id: 0 }, host: 'example.com' },
			user: { current_user: { id: 7 } },
		};
		window.localStorage.setItem(
			'jetpack-videopress-preferences-example.com-7',
			JSON.stringify( { [ SCOPE ]: { [ NAME ]: { type: 'table' } } } )
		);

		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ initialView ] = result.current;

		// Hydrated from the host-scoped key, not the shared `...-0-...` one.
		expect( initialView.type ).toBe( 'table' );
	} );

	it( 'skips redundant writes when the persisted subset is unchanged', () => {
		const { result } = renderHook( () => usePersistedView( DEFAULT_VIEW ) );
		const [ , persistView ] = result.current;

		const setItem = jest.spyOn( window.localStorage.__proto__, 'setItem' );

		const changed: View = { ...DEFAULT_VIEW, type: 'table', fields: [ 'filename' ] };
		act( () => persistView( changed ) );
		const afterFirst = setItem.mock.calls.length;
		expect( afterFirst ).toBeGreaterThan( 0 );

		// Same whitelisted subset, but with non-persisted state churn (a search
		// keystroke, a page change). No new write should hit storage.
		act( () => persistView( { ...changed, search: 'typing', page: 4 } ) );
		expect( setItem.mock.calls ).toHaveLength( afterFirst );

		setItem.mockRestore();
	} );
} );
