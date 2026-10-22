const STORE_ID = 'jetpack-connection';

describe( 'initConnectionStore registration guard', () => {
	let error;

	beforeEach( () => {
		error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		error.mockRestore();
		jest.resetModules();
	} );

	test( 'registers the store when nothing has registered it yet', () => {
		jest.isolateModules( () => {
			const { select } = require( '@wordpress/data' );
			require( '../index' ).initConnectionStore();

			expect( select( STORE_ID ).getConnectionStatus ).toEqual( expect.any( Function ) );
			expect( error ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when another script already registered the store', () => {
		/**
		 * Register a stand-in store under the connection id, as another copy would.
		 *
		 * @return {object} The data module from the isolated graph.
		 */
		const registerOtherCopy = () => {
			const data = require( '@wordpress/data' );
			data.register(
				data.createReduxStore( STORE_ID, {
					reducer: () => ( {} ),
					selectors: { getOtherCopy: () => true },
				} )
			);
			return data;
		};

		test( 'keeps the existing registration', () => {
			jest.isolateModules( () => {
				const { select } = registerOtherCopy();
				require( '../index' ).initConnectionStore();

				expect( select( STORE_ID ).getOtherCopy ).toEqual( expect.any( Function ) );
				expect( select( STORE_ID ).getConnectionStatus ).toBeUndefined();
			} );
		} );

		test( 'explains the cause and the fix rather than only the symptom', () => {
			jest.isolateModules( () => {
				registerOtherCopy();
				require( '../index' ).initConnectionStore();
			} );

			expect( error ).toHaveBeenCalledTimes( 1 );

			const message = error.mock.calls[ 0 ][ 0 ];

			expect( message ).toContain( STORE_ID );
			expect( message ).toContain( 'their own copy of the connection store' );
			expect( message ).toContain( "from '@automattic/jetpack-shared-stores/connection'" );
		} );

		test( 'still returns a descriptor and does not warn again', () => {
			jest.isolateModules( () => {
				registerOtherCopy();
				const { initConnectionStore } = require( '../index' );
				const first = initConnectionStore();
				const second = initConnectionStore();

				expect( error ).toHaveBeenCalledTimes( 1 );
				expect( first.name ).toBe( STORE_ID );
				expect( second ).toBe( first );
			} );
		} );
	} );
} );
