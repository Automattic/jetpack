import { createReduxStore, register, select } from '@wordpress/data';
import reducers from '../reducers';
import selectors from '../selectors';

/**
 * Register a store seeded with the given initial state, as the package does at load.
 *
 * Going through the real store rather than calling selectors with a hand-built object is the
 * point: `combineReducers` drops any key without a reducer, so a field can sit in the initial
 * state and never reach a selector.
 *
 * @param {object} initialState - What PHP put on the page.
 * @param {string} storeId      - A unique id, since a store cannot be registered twice.
 * @return {object} The registered store's selectors.
 */
const storeWith = ( initialState, storeId ) => {
	register( createReduxStore( storeId, { reducer: reducers, selectors, initialState } ) );

	return select( storeId );
};

describe( 'protected owner selectors', () => {
	it( 'reads what the server decided', () => {
		const store = storeWith(
			{
				hasProtectedOwner: true,
				requiresProtectedOwner: true,
				useDefaultProtectedOwnerUi: false,
			},
			'test/po-present'
		);

		expect( store.getHasProtectedOwner() ).toBe( true );
		expect( store.getRequiresProtectedOwner() ).toBe( true );
		expect( store.getUseDefaultProtectedOwnerUi() ).toBe( false );
	} );

	it( 'keeps false distinct from withheld', () => {
		const store = storeWith(
			{
				hasProtectedOwner: false,
				requiresProtectedOwner: false,
				useDefaultProtectedOwnerUi: true,
			},
			'test/po-absent'
		);

		expect( store.getHasProtectedOwner() ).toBe( false );
		expect( store.getRequiresProtectedOwner() ).toBe( false );
	} );

	it( 'reads null when the server withheld the state', () => {
		const store = storeWith(
			{
				hasProtectedOwner: null,
				requiresProtectedOwner: null,
				useDefaultProtectedOwnerUi: null,
			},
			'test/po-withheld'
		);

		expect( store.getHasProtectedOwner() ).toBeNull();
		expect( store.getRequiresProtectedOwner() ).toBeNull();
		expect( store.getUseDefaultProtectedOwnerUi() ).toBeNull();
	} );

	it( 'reads null when the fields are absent altogether', () => {
		const store = storeWith( {}, 'test/po-missing' );

		expect( store.getHasProtectedOwner() ).toBeNull();
		expect( store.getRequiresProtectedOwner() ).toBeNull();
		expect( store.getUseDefaultProtectedOwnerUi() ).toBeNull();
	} );
} );
