import { hasPendingMismatch } from '../payments-card';
import type { AdsPayment } from '../../../data/wordads';

const pending = ( paypalEmail: string ): AdsPayment => ( {
	id: 1,
	date: '2026-11-30',
	amount: 120,
	status: 'pending',
	paypalEmail,
	description: 'Pending',
} );

describe( 'hasPendingMismatch', () => {
	it.each( [
		[ 'another address', [ pending( 'old@example.com' ) ], 'new@example.com', true ],
		[ 'the current address', [ pending( 'new@example.com' ) ], 'new@example.com', false ],
		[ 'no address on file', [ pending( 'old@example.com' ) ], '', false ],
	] )( 'for a pending payout to %s: %p', ( _case, payments, paypal, expected ) => {
		expect( hasPendingMismatch( payments, paypal ) ).toBe( expected );
	} );
} );
