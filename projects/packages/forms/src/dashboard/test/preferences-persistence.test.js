import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

await jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 }, host: 'example.com' },
		user: { current_user: { id: 7 } },
	} ),
} ) );

const { ensurePreferencesPersistence } = await import( '../preferences-persistence.ts' );

const KEY = 'jetpack-forms-preferences-123-7';

let layer;

beforeEach( () => {
	window.localStorage.clear();
} );

afterEach( () => {
	jest.restoreAllMocks();
	window.localStorage.clear();
} );

describe( 'ensurePreferencesPersistence', () => {
	it( 'registers a layer keyed to the site and user', () => {
		const registerLayer = jest.fn( registered => {
			layer = registered;
		} );

		ensurePreferencesPersistence( registerLayer );

		expect( registerLayer ).toHaveBeenCalledTimes( 1 );

		layer.set( { 'core/views': { 'dataviews-postType-feedback-all': { perPage: 50 } } } );

		expect( JSON.parse( window.localStorage.getItem( KEY ) ) ).toEqual( {
			'core/views': { 'dataviews-postType-feedback-all': { perPage: 50 } },
		} );
	} );

	it( 'registers only once, so a second dashboard mount cannot re-hydrate over live state', () => {
		const registerLayer = jest.fn();

		ensurePreferencesPersistence( registerLayer );

		expect( registerLayer ).not.toHaveBeenCalled();
	} );

	it( 'hydrates from what was stored', async () => {
		window.localStorage.setItem( KEY, JSON.stringify( { 'core/views': { a: 1 } } ) );

		await expect( layer.get() ).resolves.toEqual( { 'core/views': { a: 1 } } );
	} );

	it( 'hydrates empty when nothing is stored', async () => {
		await expect( layer.get() ).resolves.toEqual( {} );
	} );

	it( 'hydrates empty rather than throwing on a damaged entry', async () => {
		window.localStorage.setItem( KEY, '{ not json' );

		await expect( layer.get() ).resolves.toEqual( {} );
	} );

	it( 'hydrates empty when storage itself throws', async () => {
		// A private window or a browser set to block site data raises here rather than
		// returning empty, and the dashboard has to keep working.
		jest.spyOn( window.localStorage.__proto__, 'getItem' ).mockImplementation( () => {
			throw new Error( 'SecurityError' );
		} );

		await expect( layer.get() ).resolves.toEqual( {} );
	} );

	it( 'swallows a write failure, because a remembered view is not worth an error', () => {
		jest.spyOn( window.localStorage.__proto__, 'setItem' ).mockImplementation( () => {
			throw new Error( 'QuotaExceededError' );
		} );

		expect( () => layer.set( { 'core/views': {} } ) ).not.toThrow();
	} );
} );
