import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getInitialState } from './state.ts';
import type { InitialState } from './types.ts';

// Node has no window; the module under test reads the one PHP localizes onto.
const globals = globalThis as unknown as { window?: Partial< Window > };

/**
 * Stand in for the global PHP localizes onto the page.
 *
 * @param state - The state to publish, or nothing to leave the page bare.
 */
function localize( state?: InitialState ) {
	globals.window = { wpcomBackupInitialState: state };
}

describe( 'getInitialState', () => {
	afterEach( () => {
		delete globals.window;
	} );

	it( 'hands back what PHP localized', () => {
		const state: InitialState = {
			state: 'activate',
			domain: 'example.wordpress.com',
			isEligible: true,
			errors: [],
			warnings: [],
			upgradeUrl: 'https://wordpress.com/checkout/example.wordpress.com/business',
			activateUrl: 'https://wordpress.com/setup/transferring-hosted-site',
		};

		localize( state );

		assert.deepEqual( getInitialState(), state );
	} );

	it( 'falls back to the upgrade prompt when the global is missing', () => {
		localize();

		// Offering a transfer to a site with no plan is the failure the fallback avoids.
		assert.equal( getInitialState().state, 'upgrade' );
	} );
} );
