import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import createNumberFormatters from '../create-number-formatters.ts';

type IntlType = typeof Intl & {
	NumberFormat: typeof Intl.NumberFormat;
};

describe( 'createNumberFormatters()', () => {
	const numberFormatters = createNumberFormatters();

	beforeEach( () => {
		numberFormatters.setLocale( 'de' );
	} );

	it( 'should create a NumberFormatters instance', () => {
		expect( numberFormatters ).toBeDefined();
	} );

	describe( 'formatNumber()', function () {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should return original number as string if formatting fails', () => {
			// mock `Intl.NumberFormat` to throw an error
			const originalIntlNumberFormat = Intl.NumberFormat;
			jest.spyOn( Intl as IntlType, 'NumberFormat' ).mockImplementation( () => {
				throw new Error( 'Invalid locale' );
			} );

			expect( numberFormatters.formatNumber( 1234567 ) ).toBe( '1234567' );

			// restore original `Intl.NumberFormat`
			( Intl as IntlType ).NumberFormat = originalIntlNumberFormat;
		} );

		describe( 'default formatNumber', function () {
			it( 'should truncate decimals', function () {
				expect( numberFormatters.formatNumber( 150.15 ) ).toBe( '150' );
			} );

			it( 'should round up', function () {
				expect( numberFormatters.formatNumber( 150.5 ) ).toBe( '151' );
			} );

			it( 'should default to locale thousands separator (. for German in test)', function () {
				expect( numberFormatters.formatNumber( 1500 ) ).toBe( '1.500' );
			} );
		} );

		describe( 'with decimal', function () {
			it( 'should default to locale decimal separator (, for German in test)', function () {
				expect( numberFormatters.formatNumber( 150, { decimals: 2 } ) ).toBe( '150,00' );
			} );
			it( 'should force the specified decimals to a not fractional number/integer', function () {
				expect( numberFormatters.formatNumber( 150, { decimals: 2 } ) ).toBe( '150,00' );
			} );
			it( 'should truncate to specified decimal', function () {
				expect( numberFormatters.formatNumber( 150.312, { decimals: 2 } ) ).toBe( '150,31' );
			} );
		} );

		describe( 'overriding defaults', function () {
			it( 'should allow overriding of locale decimal and thousands separators', function () {
				expect(
					numberFormatters.formatNumber( 2500.33, {
						decimals: 3,
					} )
				).toBe( '2.500,330' );
			} );
		} );

		describe( 'formatNumberCompact()', function () {
			describe( 'ar', () => {
				beforeEach( function () {
					numberFormatters.setLocale( 'ar-EG' );
				} );
				it( 'defaults to latin notation and localised unit', () => {
					expect(
						numberFormatters.formatNumberCompact( 1234, {
							decimals: 1,
						} )
					).toBe( '1.2 ألف' );
				} );
				it( 'non-latin/original notation and localised unit', () => {
					expect(
						numberFormatters.formatNumberCompact( 1234, {
							decimals: 1,
							forceLatin: false,
						} )
					).toBe( '١٫٢ ألف' );
				} );
			} );
		} );
	} );

	describe( 'formatCurrency()', () => {
		it( 'renders correctly EUR in de-DE locale set by setLocale', () => {
			numberFormatters.setLocale( 'de-DE' );

			const money = numberFormatters.formatCurrency( 9800900.32, 'EUR' );
			expect( money ).toBe( '9.800.900,32 €' );
		} );

		describe( 'geoLocation if present', () => {
			it( 'sets USD currency symbol to US$ if geolocation is not US and locale is en', () => {
				numberFormatters.setLocale( 'en' );
				numberFormatters.setGeoLocation( 'en' );

				const money = numberFormatters.formatCurrency( 9800900.32, 'USD' );
				expect( money ).toBe( 'US$9,800,900.32' );
			} );

			it( 'sets USD currency symbol to $ if geolocation is US and locale is en', () => {
				numberFormatters.setLocale( 'en' );
				numberFormatters.setGeoLocation( 'US' );

				const money = numberFormatters.formatCurrency( 9800900.32, 'USD' );
				expect( money ).toBe( '$9,800,900.32' );
			} );
		} );

		describe( 'setCurrencyOverrides()', () => {
			it( 'falls back to the hard-coded smallest-unit exponent when the setter is not called', () => {
				const formatters = createNumberFormatters();
				formatters.setLocale( 'in-ID' );
				// IDR's hard-coded fallback exponent is 2, so 107280000 → 1,072,800.
				const money = formatters.formatCurrency( 107280000, 'IDR', { isSmallestUnit: true } );
				expect( money ).toBe( 'Rp 1.072.800' );
			} );

			it( 'uses the dynamic decimal override when provided', () => {
				const formatters = createNumberFormatters();
				formatters.setLocale( 'in-ID' );
				formatters.setCurrencyOverrides( { IDR: { decimal: 0 } } );
				// With decimal:0 the divisor becomes 10^0=1, so 107280000 stays at 107,280,000.
				const money = formatters.formatCurrency( 107280000, 'IDR', { isSmallestUnit: true } );
				expect( money ).toBe( 'Rp 107.280.000' );
			} );

			it( 'preserves the default symbol when a partial override (decimal only) is supplied', () => {
				const formatters = createNumberFormatters();
				formatters.setLocale( 'en-US' );
				formatters.setCurrencyOverrides( { IDR: { decimal: 0 } } );
				const obj = formatters.getCurrencyObject( 12345, 'IDR' );
				expect( obj.symbol ).toBe( 'Rp' );
			} );

			it( 'allows overriding the symbol via the setter', () => {
				const formatters = createNumberFormatters();
				formatters.setLocale( 'en-US' );
				formatters.setCurrencyOverrides( { EUR: { symbol: 'EURO' } } );
				const money = formatters.formatCurrency( 10, 'EUR' );
				expect( money ).toBe( 'EURO10.00' );
			} );

			it( 'leaves currencies not listed in the dynamic map alone', () => {
				const formatters = createNumberFormatters();
				formatters.setLocale( 'hu-HU' );
				// Only override IDR; HUF should still hit its hard-coded exponent of 2.
				formatters.setCurrencyOverrides( { IDR: { decimal: 0 } } );
				const money = formatters.formatCurrency( 99900, 'HUF', { isSmallestUnit: true } );
				expect( money ).toBe( '999 Ft' );
			} );
		} );
	} );

	describe( 'getCurrencyObject()', () => {
		beforeEach( async () => {
			jest.clearAllMocks();
			numberFormatters.setLocale( 'de' );
		} );

		it( 'should return the currency object for EUR in de-DE locale set by setLocale', () => {
			numberFormatters.setLocale( 'de-DE' );
			const currencyObject = numberFormatters.getCurrencyObject( 9800900.32, 'EUR' );
			expect( currencyObject ).toEqual( {
				symbol: '€',
				symbolPosition: 'after',
				integer: '9.800.900',
				fraction: ',32',
				sign: '',
				hasNonZeroFraction: true,
				floatValue: 9800900.32,
			} );
		} );

		describe( 'geoLocation if present', () => {
			it( 'sets USD currency symbol to US$ if geolocation is not US and locale is en', () => {
				numberFormatters.setLocale( 'en' );
				numberFormatters.setGeoLocation( 'en' );

				const currencyObject = numberFormatters.getCurrencyObject( 9800900.32, 'USD' );
				expect( currencyObject ).toEqual( {
					symbol: 'US$',
					symbolPosition: 'before',
					integer: '9,800,900',
					fraction: '.32',
					sign: '',
					hasNonZeroFraction: true,
					floatValue: 9800900.32,
				} );
			} );

			it( 'sets USD currency symbol to $ if geolocation is US and locale is en', () => {
				numberFormatters.setLocale( 'en' );
				numberFormatters.setGeoLocation( 'US' );

				const currencyObject = numberFormatters.getCurrencyObject( 9800900.32, 'USD' );
				expect( currencyObject ).toEqual( {
					symbol: '$',
					symbolPosition: 'before',
					integer: '9,800,900',
					fraction: '.32',
					sign: '',
					hasNonZeroFraction: true,
					floatValue: 9800900.32,
				} );
			} );
		} );
	} );
} );
