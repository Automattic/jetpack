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
	globals.window = { wpcomHostingFeatureInitialState: state };
}

const UPGRADE_STATE: InitialState = {
	state: 'upgrade',
	domain: '',
	isEligible: true,
	errors: [],
	warnings: [],
	upgradeUrl: 'https://wordpress.com/plans/',
	activateUrl: 'https://wordpress.com/setup/transferring-hosted-site',
	supportUrl: 'https://wordpress.com/help/contact',
	hasRevertedTransfer: false,
	transferFailed: false,
	checkoutPending: false,
};

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
			supportUrl: 'https://wordpress.com/help/contact',
			hasRevertedTransfer: false,
			transferFailed: true,
			checkoutPending: false,
		};

		localize( state );

		assert.deepEqual( getInitialState(), state );
	} );

	it( "reads its own page's state when the admin shell holds Backup and Scan in one document", () => {
		const scan = { ...UPGRADE_STATE, domain: 'scan.example' };
		const backup = { ...UPGRADE_STATE, domain: 'backup.example' };
		// Scan loaded last, so the shared global is Scan's.
		globals.window = {
			wpcomHostingFeatureInitialState: scan,
			wpcomHostingFeatureInitialStates: { 'wpcom-backup': backup, 'wpcom-scan': scan },
		};

		assert.equal( getInitialState( 'wpcom-backup' ).domain, 'backup.example' );
	} );

	it( 'falls back to the upgrade prompt when the global is missing', () => {
		localize();

		// Offering a transfer to a site with no plan is the failure the fallback avoids.
		assert.equal( getInitialState().state, 'upgrade' );
	} );
} );
