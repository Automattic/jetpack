/**
 * Internal dependencies
 */
import { formatEmailRate, isEmailRateKnown } from '../format-email-rate';

describe( 'isEmailRateKnown', () => {
	it( 'is known when recipients engaged, or when nobody engaged', () => {
		expect( isEmailRateKnown( { total: 12, unique: 10, sends: 100 } ) ).toBe( true );
		expect( isEmailRateKnown( { total: 0, unique: 0, sends: 100 } ) ).toBe( true );
	} );

	it( 'is unknown when events exist without an attributed recipient', () => {
		expect( isEmailRateKnown( { total: 12, unique: 0, sends: 100 } ) ).toBe( false );
	} );

	it( 'is unknown when nothing was sent', () => {
		expect( isEmailRateKnown( { total: 0, unique: 0, sends: 0 } ) ).toBe( false );
		expect( isEmailRateKnown( { total: 12, unique: 10, sends: 0 } ) ).toBe( false );
	} );
} );

describe( 'formatEmailRate', () => {
	it( 'formats a 0–100 rate at up to two decimals', () => {
		expect( formatEmailRate( 38.1, { total: 400, unique: 380, sends: 1000 } ) ).toBe( '38.1%' );
		expect( formatEmailRate( 3.814, { total: 40, unique: 38, sends: 1000 } ) ).toBe( '3.81%' );
	} );

	it( 'shows a genuine zero when nobody engaged', () => {
		expect( formatEmailRate( 0, { total: 0, unique: 0, sends: 1000 } ) ).toBe( '0%' );
	} );

	it( 'shows an em dash when the rate is unknown', () => {
		expect( formatEmailRate( 0, { total: 12, unique: 0, sends: 1000 } ) ).toBe( '—' );
		expect( formatEmailRate( 0, { total: 0, unique: 0, sends: 0 } ) ).toBe( '—' );
	} );
} );
