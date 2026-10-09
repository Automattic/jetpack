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
import * as barrel from '../../index.js';
import { CONNECTION_STORE_ID, initConnectionStore } from '../store/connection';

describe( 'package exports', () => {
	it( 'exposes the jetpack-modules store and its id from the barrel', () => {
		expect( barrel.JETPACK_MODULES_STORE_ID ).toBe( 'jetpack-modules' );
		expect( barrel.store ).toBeDefined();
		expect( barrel.store.name ).toBe( 'jetpack-modules' );
	} );

	it( 'exposes the wordpress-com/plans store and its selectors from the barrel', () => {
		expect( barrel.wordpressPlansStore ).toBeDefined();
		expect( barrel.wordpressPlansStore.name ).toBe( 'wordpress-com/plans' );
		expect( typeof barrel.selectors.getPlan ).toBe( 'function' );
		expect( typeof barrel.selectors.getAiAssistantFeature ).toBe( 'function' );
	} );

	it( 'exposes the connection store id and lazy initializer from the /connection subpath', () => {
		expect( CONNECTION_STORE_ID ).toBe( 'jetpack-connection' );
		expect( typeof initConnectionStore ).toBe( 'function' );
		const connectionStore = initConnectionStore();
		expect( connectionStore.name ).toBe( 'jetpack-connection' );
	} );

	it( 'does not export the connection store from the main barrel (isolation invariant)', () => {
		/*
		 * The connection store lives on the /connection subpath, not the main
		 * barrel, so consumers of the other stores neither bundle nor evaluate it.
		 * If someone adds it back to the barrel's `export *`, this fails first.
		 */
		expect( barrel.CONNECTION_STORE_ID ).toBeUndefined();
		expect( barrel.initConnectionStore ).toBeUndefined();
	} );
} );
