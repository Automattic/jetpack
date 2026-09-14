import { jest } from '@jest/globals';

const createReduxStore = jest.fn( ( name, config ) => ( { name, ...config } ) );
const register = jest.fn();
const select = jest.fn();

jest.unstable_mockModule( '@wordpress/data', () => ( {
	__esModule: true,
	createReduxStore,
	register,
	select,
} ) );

const { default: storeHolder } = await import( '../store-holder' );

const STORE_ID = 'jetpack-connection';
const CONFIG = { reducer: () => ( {} ) };

describe( 'storeHolder.mayBeInit', () => {
	let error;

	beforeEach( () => {
		jest.clearAllMocks();
		storeHolder.store = null;
		error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		error.mockRestore();
	} );

	test( 'registers the store when nothing has registered it yet', () => {
		select.mockReturnValue( undefined );

		storeHolder.mayBeInit( STORE_ID, CONFIG );

		expect( register ).toHaveBeenCalledTimes( 1 );
		expect( error ).not.toHaveBeenCalled();
	} );

	test( 'registers only once for repeated calls from the same copy', () => {
		select.mockReturnValue( undefined );

		storeHolder.mayBeInit( STORE_ID, CONFIG );
		storeHolder.mayBeInit( STORE_ID, CONFIG );

		expect( register ).toHaveBeenCalledTimes( 1 );
	} );

	/*
	 * Another bundle's copy got there first. The module-scope guard cannot see
	 * that, which is the whole reason this path exists.
	 */
	describe( 'when another copy of the package already registered the store', () => {
		beforeEach( () => {
			select.mockReturnValue( { someSelector: () => {} } );
		} );

		test( 'does not register again', () => {
			storeHolder.mayBeInit( STORE_ID, CONFIG );

			expect( register ).not.toHaveBeenCalled();
		} );

		test( 'explains the cause and the fix rather than only the symptom', () => {
			storeHolder.mayBeInit( STORE_ID, CONFIG );

			expect( error ).toHaveBeenCalledTimes( 1 );

			const message = error.mock.calls[ 0 ][ 0 ];

			// Names the store, so it is greppable.
			expect( message ).toContain( STORE_ID );
			// Says it is a bundling problem, not a runtime break.
			expect( message ).toContain( 'bundled their own copy' );
			// Points at the actual cause and the fix.
			expect( message ).toContain( 'subpath import' );
			expect( message ).toContain( "from '@automattic/jetpack-connection'" );
		} );

		test( 'still leaves this copy initialised, so it does not warn again', () => {
			storeHolder.mayBeInit( STORE_ID, CONFIG );
			storeHolder.mayBeInit( STORE_ID, CONFIG );

			expect( error ).toHaveBeenCalledTimes( 1 );
			expect( storeHolder.store ).not.toBeNull();
		} );
	} );
} );
