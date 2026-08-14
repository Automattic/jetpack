/**
 * Back-compat shim coverage.
 *
 * The `wordpress-com/plans` store moved to `@automattic/jetpack-shared-stores`,
 * but the historical `@automattic/jetpack-shared-extension-utils/store/wordpress-com`
 * (and `/types`) import paths must keep resolving the same values and types.
 */
import { selectors, wordpressPlansStore } from '../index';
import type { WordPressPlansSelectors } from '../index';
import type { FeatureControl, TierProp } from '../types';

describe( 'store/wordpress-com back-compat shim', () => {
	it( 're-exports the wordpress-com/plans store and its selectors', () => {
		expect( wordpressPlansStore ).toBeDefined();
		expect( wordpressPlansStore.name ).toBe( 'wordpress-com/plans' );
		expect( typeof selectors.getPlan ).toBe( 'function' );
	} );

	it( 'still resolves the public types through the shim', () => {
		// Compile-time assertions: the typecheck fails if the type re-export
		// chain (shim -> shared-stores barrel -> store types) ever breaks.
		const plansSelectors: WordPressPlansSelectors | undefined = undefined;
		const featureControl: FeatureControl | undefined = undefined;
		const tier: TierProp | undefined = undefined;
		expect( plansSelectors ).toBeUndefined();
		expect( featureControl ).toBeUndefined();
		expect( tier ).toBeUndefined();
	} );
} );
