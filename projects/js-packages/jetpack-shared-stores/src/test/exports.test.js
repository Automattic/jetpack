/**
 * Public export contract.
 *
 * The package is externalized into a single bundle, so the UMD global and every
 * consumer depend on these names. The main barrel exposes the lightweight
 * jetpack-modules and wordpress-com/plans stores; the heavier connection store
 * lives on the `/connection` subpath so consumers of the other stores do not
 * eagerly evaluate it. These assertions lock that surface and the store ids
 * (a string contract used across 25+ consumers).
 */
import { store, JETPACK_MODULES_STORE_ID, wordpressPlansStore, selectors } from '../../index.js';
import { CONNECTION_STORE_ID } from '../store/connection';

describe( 'package exports', () => {
	it( 'exposes the jetpack-modules store and its id from the barrel', () => {
		expect( JETPACK_MODULES_STORE_ID ).toBe( 'jetpack-modules' );
		expect( store ).toBeDefined();
		expect( store.name ).toBe( 'jetpack-modules' );
	} );

	it( 'exposes the wordpress-com/plans store and its selectors from the barrel', () => {
		expect( wordpressPlansStore ).toBeDefined();
		expect( wordpressPlansStore.name ).toBe( 'wordpress-com/plans' );
		expect( typeof selectors.getPlan ).toBe( 'function' );
		expect( typeof selectors.getAiAssistantFeature ).toBe( 'function' );
	} );

	it( 'exposes the connection store id from the /connection subpath', () => {
		expect( CONNECTION_STORE_ID ).toBe( 'jetpack-connection' );
	} );
} );
