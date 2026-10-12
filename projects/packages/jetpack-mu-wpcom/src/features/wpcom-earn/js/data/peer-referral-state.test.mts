import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toPeerReferral } from './peer-referral-state.ts';

describe( 'toPeerReferral', () => {
	it( 'offers the link once referrals are on', () => {
		assert.deepEqual( toPeerReferral( 'https://wordpress.com/refer-a-friend/abc' ), {
			state: 'enabled',
			link: 'https://wordpress.com/refer-a-friend/abc',
		} );
	} );

	it( 'offers to turn referrals on, whichever key the error code arrives under', () => {
		assert.equal(
			toPeerReferral( null, { code: 'peer_referral_link_not_enabled' } ).state,
			'available'
		);
		assert.equal(
			toPeerReferral( null, { error: 'peer_referral_link_not_enabled' } ).state,
			'available'
		);
	} );

	it( 'treats any other failure as ineligible', () => {
		assert.equal(
			toPeerReferral( null, { code: 'peer_referral_link_error' } ).state,
			'unavailable'
		);
		assert.equal( toPeerReferral( '' ).state, 'unavailable' );
	} );
} );
