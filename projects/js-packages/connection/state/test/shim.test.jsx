/**
 * Back-compat shim coverage.
 *
 * The connection store moved to `@automattic/jetpack-shared-stores` and now
 * registers lazily via `initConnectionStore()`, but the historical
 * `./state/store` import path (and the `STORE_ID` name re-exported as
 * `CONNECTION_STORE_ID` from the package root) must keep resolving the same
 * store id value.
 */
import { STORE_ID } from '../store';

describe( 'connection store back-compat shim', () => {
	it( 're-exports the jetpack-connection store id', () => {
		expect( STORE_ID ).toBe( 'jetpack-connection' );
	} );
} );
