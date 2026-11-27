import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getInitialState } from './state.ts';

describe( 'getInitialState', () => {
	it( 'falls back to the upgrade prompt when the global is missing', () => {
		// Offering a transfer to a site with no plan is the failure the fallback avoids.
		assert.equal( getInitialState( undefined ).state, 'upgrade' );
	} );
} );
