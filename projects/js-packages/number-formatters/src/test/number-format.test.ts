import { describe, expect, it } from '@jest/globals';
import { numberFormat, numberFormatCompact } from '../number-format.js';

describe( 'numberFormat()', () => {
	it( 'should format number with default options', () => {
		const result = numberFormat( { browserSafeLocale: 'en-US' } ).format( 1234.56 );
		expect( result ).toBe( '1,235' );
	} );

	it( 'should format number with specified decimals', () => {
		const result = numberFormat( { browserSafeLocale: 'en-US', decimals: 2 } ).format( 1234.56 );
		expect( result ).toBe( '1,234.56' );
	} );

	it( 'should format number with forceLatin set to false', () => {
		const result = numberFormat( { browserSafeLocale: 'ar-EG', forceLatin: false } ).format(
			1234.56
		);
		expect( result ).toBe( '١٬٢٣٥' );
	} );

	it( 'should format number with custom numberFormatOptions', () => {
		const result = numberFormat( {
			browserSafeLocale: 'en-US',
			numberFormatOptions: { style: 'currency', currency: 'USD' },
		} ).format( 1234.56 );
		expect( result ).toBe( '$1,235' );
	} );
} );

describe( 'numberFormatCompact()', () => {
	it( 'should format number in compact notation', () => {
		const result = numberFormatCompact( { browserSafeLocale: 'en-US' } ).format( 1234567 );
		expect( result ).toBe( '1.2M' );
	} );

	it( 'should format number in compact notation with custom maximumFractionDigits', () => {
		const result = numberFormatCompact( {
			browserSafeLocale: 'en-US',
			numberFormatOptions: { maximumFractionDigits: 2 },
		} ).format( 1234567 );
		expect( result ).toBe( '1.23M' );
	} );

	it( 'should format number in compact notation with forceLatin set to false', () => {
		const result = numberFormatCompact( {
			browserSafeLocale: 'ar-EG',
			forceLatin: false,
		} ).format( 1234567 );
		expect( result ).toBe( '١٫٢ مليون' );
	} );
} );
