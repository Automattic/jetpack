/**
 * Internal dependencies
 */
import { formatEmailRate, isEmailRateKnown } from '../format-email-rate';

describe( 'isEmailRateKnown', () => {
	it( 'is unknown only when events exist without an attributed recipient', () => {
		expect( isEmailRateKnown( 0, 0 ) ).toBe( true );
		expect( isEmailRateKnown( 12, 10 ) ).toBe( true );
		expect( isEmailRateKnown( 12, 0 ) ).toBe( false );
	} );
} );

describe( 'formatEmailRate', () => {
	it( 'formats a 0–100 rate at up to two decimals', () => {
		expect( formatEmailRate( 38.1, 400, 380 ) ).toBe( '38.1%' );
		expect( formatEmailRate( 3.814, 40, 38 ) ).toBe( '3.81%' );
	} );

	it( 'shows a genuine zero when there were no events', () => {
		expect( formatEmailRate( 0, 0, 0 ) ).toBe( '0%' );
	} );

	it( 'shows an em dash when no event could be attributed to a recipient', () => {
		expect( formatEmailRate( 0, 12, 0 ) ).toBe( '—' );
	} );
} );
