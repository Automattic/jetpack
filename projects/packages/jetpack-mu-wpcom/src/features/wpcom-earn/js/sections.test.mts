import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getCalypsoUrl } from './sections.ts';

describe( 'getCalypsoUrl', () => {
	it( 'links the home section to the bare Earn URL', () => {
		assert.equal(
			getCalypsoUrl( 'home', 'example.wordpress.com' ),
			'https://wordpress.com/earn/example.wordpress.com'
		);
	} );

	it( 'links the Ads tab to the earnings screen Calypso opens it on', () => {
		assert.equal(
			getCalypsoUrl( 'ads', 'example.wordpress.com' ),
			'https://wordpress.com/earn/ads-earnings/example.wordpress.com'
		);
	} );

	it( 'keeps the domain in one path segment', () => {
		assert.equal(
			getCalypsoUrl( 'payments', 'example.com/evil' ),
			'https://wordpress.com/earn/payments/example.com%2Fevil'
		);
	} );
} );
