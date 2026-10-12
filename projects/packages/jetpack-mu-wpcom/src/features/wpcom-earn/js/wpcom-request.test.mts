import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PROXY_BASE, WpcomApiError, rejectBodyError, toFetchOptions } from './wpcom-request.ts';

describe( 'toFetchOptions', () => {
	const coupons = {
		api: 'wpcom/v2',
		path: 'memberships/coupons',
		query: { type: 'all', is_editable: true, offset: undefined },
	} as const;

	it( 'calls WordPress.com directly on Simple', () => {
		assert.deepEqual( toFetchOptions( coupons, false ), {
			path: '/wpcom/v2/memberships/coupons?type=all&is_editable=true',
			method: 'GET',
		} );
	} );

	it( 'goes through the proxy on Atomic', () => {
		assert.equal(
			toFetchOptions( coupons, true ).path,
			`${ PROXY_BASE }/wpcom/v2/memberships/coupons?type=all&is_editable=true`
		);
	} );

	it( 'keeps a per-user request off the site on Simple only', () => {
		const referral = { api: 'rest/v1.1', path: 'me/peer-referral-link' } as const;

		assert.equal( toFetchOptions( referral, false ).global, true );
		assert.equal( toFetchOptions( referral, true ).global, undefined );
	} );

	it( 'sends a body only when there is one', () => {
		const options = toFetchOptions(
			{
				api: 'wpcom/v2',
				path: 'memberships/product/7',
				method: 'DELETE',
				data: { cancel_subscriptions: true },
			},
			false
		);

		assert.deepEqual( options.data, { cancel_subscriptions: true } );
		assert.equal( 'data' in toFetchOptions( coupons, false ), false );
	} );
} );

describe( 'rejectBodyError', () => {
	it( 'rejects the error a memberships endpoint reports under a success status', () => {
		assert.throws(
			() => rejectBodyError( { error: 'The price is below the minimum.' } ),
			( error: unknown ) =>
				error instanceof WpcomApiError && error.message === 'The price is below the minimum.'
		);
	} );

	it( 'rejects an error object with its code', () => {
		assert.throws(
			() => rejectBodyError( { error: { code: 'comp_not_found', message: 'Not found.' } } ),
			( error: unknown ) => error instanceof WpcomApiError && error.code === 'comp_not_found'
		);
	} );

	it( 'passes through bodies that report no error, including bare strings', () => {
		const product = { ID: 7, title: 'Gold' };

		assert.equal( rejectBodyError( product ), product );
		assert.equal(
			rejectBodyError( 'https://wordpress.com/refer-a-friend/abc' ),
			'https://wordpress.com/refer-a-friend/abc'
		);
	} );
} );
