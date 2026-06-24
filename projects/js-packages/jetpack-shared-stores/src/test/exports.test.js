/**
 * Barrel export contract.
 *
 * The package exposes only its barrel entry and is externalized into a single
 * bundle, so the UMD global and every consumer depend on these names being
 * present on the package root. These assertions lock that public surface and
 * the store ids (which are a string contract used across 25+ consumers).
 */
import { store, JETPACK_MODULES_STORE_ID, wordpressPlansStore, selectors } from '../../index.js';

describe( 'package barrel exports', () => {
	it( 'exposes the jetpack-modules store and its id', () => {
		expect( JETPACK_MODULES_STORE_ID ).toBe( 'jetpack-modules' );
		expect( store ).toBeDefined();
		expect( store.name ).toBe( 'jetpack-modules' );
	} );

	it( 'exposes the wordpress-com/plans store and its selectors', () => {
		expect( wordpressPlansStore ).toBeDefined();
		expect( wordpressPlansStore.name ).toBe( 'wordpress-com/plans' );
		expect( typeof selectors.getPlan ).toBe( 'function' );
		expect( typeof selectors.getAiAssistantFeature ).toBe( 'function' );
	} );
} );
