/**
 * External dependencies
 */
import { formatCurrency, getCurrencyObject } from '@automattic/number-formatters';
/**
 * Internal dependencies
 */
import { formatMetricValue } from '../format-metric-value';

jest.mock( '@automattic/number-formatters', () => {
	const actual = jest.requireActual( '@automattic/number-formatters' );
	return {
		...actual,
		formatCurrency: jest.fn(),
		getCurrencyObject: jest.fn(),
	};
} );

describe( 'formatMetricValue', () => {
	/**
	 * Default mock setup: USD, symbol before.
	 */
	const setupCurrency = ( {
		symbol = '$',
		position = 'before',
		hasSpace = false,
	}: {
		symbol?: string;
		position?: 'before' | 'after';
		code?: string;
		hasSpace?: boolean;
	} = {} ) => {
		const sp = hasSpace ? ' ' : '';

		( getCurrencyObject as jest.Mock ).mockReturnValue( {
			sign: '',
			symbol,
			symbolPosition: position,
			integer: '0',
			fraction: '00',
			hasNonZeroFraction: false,
		} );

		( formatCurrency as jest.Mock ).mockImplementation( ( value: number ) => {
			const formatted = Math.abs( value ).toLocaleString( 'en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			} );
			const sign = value < 0 ? '-' : '';

			return position === 'before'
				? `${ sign }${ symbol }${ sp }${ formatted }`
				: `${ sign }${ formatted }${ sp }${ symbol }`;
		} );
	};

	beforeEach( () => {
		jest.clearAllMocks();
		setupCurrency();
	} );

	describe( 'invalid and edge-case inputs', () => {
		it( 'returns empty string for NaN', () => {
			expect( formatMetricValue( 'not-a-number' ) ).toBe( '' );
		} );

		it( 'returns empty string for null', () => {
			expect( formatMetricValue( null as unknown as number ) ).toBe( '' );
		} );

		it( 'returns empty string for undefined', () => {
			expect( formatMetricValue( undefined as unknown as number ) ).toBe( '' );
		} );

		it( 'coerces empty string to zero', () => {
			expect( formatMetricValue( '' ) ).toBe( '0' );
		} );

		it( 'accepts numeric strings', () => {
			expect( formatMetricValue( '1234' ) ).toBe( '1,234' );
		} );

		it( 'accepts numeric strings with decimals', () => {
			expect( formatMetricValue( '99.99', 'average' ) ).toBe( '99.99' );
		} );

		it( 'formats zero', () => {
			expect( formatMetricValue( 0 ) ).toBe( '0' );
		} );

		it( 'formats negative zero', () => {
			expect( formatMetricValue( -0 ) ).toBe( '-0' );
		} );
	} );

	it( 'defaults to type number', () => {
		expect( formatMetricValue( 42.42 ) ).toBe( '42' );
	} );

	describe( 'type: currency (standard)', () => {
		it( 'delegates to formatCurrency', () => {
			formatMetricValue( 192088.05, 'currency' );

			expect( formatCurrency ).toHaveBeenCalledWith( 192088.05, 'USD' );
		} );

		it( 'formats currency without multipliers', () => {
			expect( formatMetricValue( 192088.05, 'currency' ) ).toBe( '$192,088.05' );
		} );

		it( 'passes currencyCode to formatCurrency', () => {
			formatMetricValue( 100, 'currency', {
				currencyCode: 'EUR',
			} );

			expect( formatCurrency ).toHaveBeenCalledWith( 100, 'EUR' );
		} );

		it( 'formats currency with multipliers', () => {
			const result = formatMetricValue( 192088.05, 'currency', {
				useMultipliers: true,
				decimals: 2,
			} );
			expect( result ).toBe( '$192.09K' );
		} );

		it( 'formats currency with multipliers and signDisplay', () => {
			const negativeResult = formatMetricValue( -192088.05, 'currency', {
				useMultipliers: true,
				signDisplay: 'always',
				decimals: 2,
			} );
			expect( negativeResult ).toBe( '-$192.09K' );

			const positiveResult = formatMetricValue( 192088.05, 'currency', {
				useMultipliers: true,
				signDisplay: 'always',
				decimals: 2,
			} );
			expect( positiveResult ).toBe( '+$192.09K' );
		} );

		it( 'formats currency with signDisplay', () => {
			const negativeResult = formatMetricValue( -192088.05, 'currency', {
				signDisplay: 'always',
			} );
			expect( negativeResult ).toBe( '-$192,088.05' );

			const positiveResult = formatMetricValue( 192088.05, 'currency', {
				signDisplay: 'always',
			} );
			expect( positiveResult ).toBe( '+$192,088.05' );
		} );
	} );

	describe( 'type: currency (symbol position)', () => {
		it( 'places symbol after number when position is after', () => {
			setupCurrency( {
				symbol: '€',
				position: 'after',
				code: 'EUR',
				hasSpace: true,
			} );

			const result = formatMetricValue( 1500, 'currency', {
				useMultipliers: true,
				decimals: 1,
				currencyCode: 'EUR',
			} );

			expect( result ).toBe( '1.5K €' );
		} );

		it( 'places symbol before number when position is before', () => {
			setupCurrency( { symbol: '£', position: 'before', code: 'GBP' } );

			const result = formatMetricValue( 1500, 'currency', {
				useMultipliers: true,
				decimals: 1,
				currencyCode: 'GBP',
			} );

			expect( result ).toBe( '£1.5K' );
		} );

		it( 'handles negative values with after position', () => {
			setupCurrency( {
				symbol: '€',
				position: 'after',
				code: 'EUR',
				hasSpace: true,
			} );

			const result = formatMetricValue( -1500, 'currency', {
				useMultipliers: true,
				decimals: 1,
				currencyCode: 'EUR',
			} );

			expect( result ).toBe( '-1.5K €' );
		} );

		it( 'handles signDisplay with before position', () => {
			setupCurrency( { symbol: '£', position: 'before', code: 'GBP' } );

			const result = formatMetricValue( 1500, 'currency', {
				useMultipliers: true,
				decimals: 1,
				signDisplay: 'always',
				currencyCode: 'GBP',
			} );

			expect( result ).toBe( '+£1.5K' );
		} );

		it( 'formats millions with after position', () => {
			setupCurrency( {
				symbol: '€',
				position: 'after',
				code: 'EUR',
				hasSpace: true,
			} );

			const result = formatMetricValue( 1500000, 'currency', {
				useMultipliers: true,
				decimals: 1,
				currencyCode: 'EUR',
			} );

			expect( result ).toBe( '1.5M €' );
		} );

		it( 'passes currencyCode to getCurrencyObject for multipliers', () => {
			formatMetricValue( 1500, 'currency', {
				useMultipliers: true,
				currencyCode: 'JPY',
			} );

			expect( getCurrencyObject ).toHaveBeenCalledWith( 0, 'JPY' );
		} );

		it( 'preserves space between symbol and number for BRL', () => {
			setupCurrency( {
				symbol: 'R$',
				position: 'before',
				code: 'BRL',
				hasSpace: true,
			} );

			const result = formatMetricValue( 2500, 'currency', {
				useMultipliers: true,
				decimals: 1,
				currencyCode: 'BRL',
			} );

			expect( result ).toBe( 'R$ 2.5K' );
		} );

		it( 'does not call getCurrencyObject for non-multiplier currency', () => {
			formatMetricValue( 100, 'currency' );

			expect( getCurrencyObject ).not.toHaveBeenCalled();
			expect( formatCurrency ).toHaveBeenCalled();
		} );
	} );

	describe( 'type: percentage', () => {
		it( 'formats decimal as percentage with default sign', () => {
			expect( formatMetricValue( 0.5, 'percentage' ) ).toBe( '+50%' );
		} );

		it( 'formats whole number as percentage with default sign', () => {
			expect( formatMetricValue( 1, 'percentage' ) ).toBe( '+100%' );
		} );

		it( 'respects decimals option', () => {
			expect( formatMetricValue( 0.12345, 'percentage', { decimals: 1 } ) ).toBe( '+12.3%' );
		} );

		it( 'formats negative percentage', () => {
			expect( formatMetricValue( -0.25, 'percentage' ) ).toBe( '-25%' );
		} );

		it( 'allows disabling the sign display', () => {
			expect(
				formatMetricValue( 0.5, 'percentage', {
					signDisplay: 'auto',
				} )
			).toBe( '50%' );
		} );

		it( 'omits sign for zero with default exceptZero', () => {
			expect( formatMetricValue( 0, 'percentage' ) ).toBe( '0%' );
		} );

		it( 'formats small decimals without trailing zeros', () => {
			expect( formatMetricValue( 0.1, 'percentage' ) ).toBe( '+10%' );
		} );
	} );

	describe( 'type: average', () => {
		it( 'formats finite average', () => {
			expect( formatMetricValue( 0.125, 'average' ) ).toBe( '0.13' );
		} );

		it( 'returns em dash for Infinity', () => {
			expect( formatMetricValue( Infinity, 'average' ) ).toBe( '—' );
		} );

		it( 'returns em dash for negative Infinity', () => {
			expect( formatMetricValue( -Infinity, 'average' ) ).toBe( '—' );
		} );

		it( 'respects custom decimals', () => {
			expect( formatMetricValue( 3.14159, 'average', { decimals: 4 } ) ).toBe( '3.1416' );
		} );

		it( 'formats zero with default 2 decimals', () => {
			expect( formatMetricValue( 0, 'average' ) ).toBe( '0.00' );
		} );
	} );

	describe( 'type: number', () => {
		it( 'formats number without multipliers', () => {
			expect( formatMetricValue( 9876.543, 'number' ) ).toBe( '9,877' );
		} );

		it( 'formats number with multipliers (default 0 decimals)', () => {
			expect(
				formatMetricValue( 1500, 'number', {
					useMultipliers: true,
				} )
			).toBe( '2K' );
		} );

		it( 'formats number with multipliers and specific decimals', () => {
			expect(
				formatMetricValue( 1500, 'number', {
					useMultipliers: true,
					decimals: 1,
				} )
			).toBe( '1.5K' );
		} );
	} );
} );
