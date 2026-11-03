import { setLocale } from '@automattic/number-formatters';
import { formatMetric, formatRate } from '../format-metric';

describe( 'format-metric', () => {
	beforeEach( () => {
		setLocale( 'en' );
	} );

	afterEach( () => {
		setLocale( 'en' );
	} );

	describe( 'formatMetric', () => {
		it( 'formats a number with locale grouping', () => {
			expect( formatMetric( 1234 ) ).toBe( '1,234' );
		} );

		it( 'formats zero as a plain number, not the placeholder', () => {
			expect( formatMetric( 0 ) ).toBe( '0' );
		} );

		it( 'returns an em dash for null', () => {
			expect( formatMetric( null ) ).toBe( '—' );
		} );

		it( 'returns an em dash for undefined', () => {
			expect( formatMetric( undefined ) ).toBe( '—' );
		} );
	} );

	describe( 'formatRate', () => {
		it( 'formats a whole-number rate with a percent sign', () => {
			expect( formatRate( 58 ) ).toBe( '58%' );
		} );

		it( 'rounds a fractional rate to the nearest whole number', () => {
			expect( formatRate( 57.6 ) ).toBe( '58%' );
		} );

		it( 'formats zero as 0%, not the placeholder', () => {
			expect( formatRate( 0 ) ).toBe( '0%' );
		} );

		it( 'returns an em dash for null', () => {
			expect( formatRate( null ) ).toBe( '—' );
		} );

		it( 'returns an em dash for undefined', () => {
			expect( formatRate( undefined ) ).toBe( '—' );
		} );

		it( 'places the percent sign according to the locale', () => {
			setLocale( 'fr' );

			// CLDR has used both NBSP (U+00A0) and NNBSP (U+202F) before the French percent sign.
			expect( formatRate( 58 ) ).toMatch( /^58[\u00A0\u202F]%$/ );
		} );
	} );
} );
