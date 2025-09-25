/**
 * Tests for formatMetricValue and formatPercentage utilities
 */
import { formatMetricValue } from '../format-metric-value';
import { formatPercentage } from '../format-percentage';

describe( 'formatMetricValue', () => {
	it( 'formats numbers correctly', () => {
		expect( formatMetricValue( 1234 ) ).toBe( '1,234' );
		expect( formatMetricValue( 1234.56, 'number', { decimals: 2 } ) ).toBe( '1,234.56' );
	} );

	it( 'formats currency correctly', () => {
		expect( formatMetricValue( 1234.56, 'currency' ) ).toBe( '$1,234.56' );
	} );

	it( 'formats percentages correctly with average type', () => {
		expect( formatMetricValue( 0.75, 'average' ) ).toBe( '+75%' );
		expect( formatMetricValue( 0.751, 'average', { decimals: 1 } ) ).toBe( '+75.1%' );
	} );

	it( 'handles null and undefined values', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect( formatMetricValue( null as any ) ).toBe( '' );
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect( formatMetricValue( undefined as any ) ).toBe( '' );
	} );

	it( 'handles NaN values', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect( formatMetricValue( 'invalid' as any ) ).toBe( '' );
	} );
} );

describe( 'formatPercentage', () => {
	it( 'formats whole numbers without decimals', () => {
		expect( formatPercentage( 30 ) ).toBe( '30%' );
		expect( formatPercentage( 100 ) ).toBe( '100%' );
		expect( formatPercentage( 0 ) ).toBe( '0%' );
	} );

	it( 'formats numbers with 1 decimal place', () => {
		expect( formatPercentage( 30.1 ) ).toBe( '30.1%' );
		expect( formatPercentage( 99.9 ) ).toBe( '99.9%' );
		expect( formatPercentage( 0.5 ) ).toBe( '0.5%' );
	} );

	it( 'formats numbers with 2 decimal places', () => {
		expect( formatPercentage( 30.25 ) ).toBe( '30.25%' );
		expect( formatPercentage( 99.99 ) ).toBe( '99.99%' );
		expect( formatPercentage( 0.05 ) ).toBe( '0.05%' );
	} );

	it( 'rounds numbers with more than 2 decimal places', () => {
		expect( formatPercentage( 30.256 ) ).toBe( '30.26%' );
		expect( formatPercentage( 30.254 ) ).toBe( '30.25%' );
		expect( formatPercentage( 99.995 ) ).toBe( '100%' );
	} );

	it( 'removes trailing zeros', () => {
		expect( formatPercentage( 30.0 ) ).toBe( '30%' );
		expect( formatPercentage( 30.1 ) ).toBe( '30.1%' );
		expect( formatPercentage( 30.2 ) ).toBe( '30.2%' );
	} );

	it( 'handles very small percentages', () => {
		expect( formatPercentage( 0.01 ) ).toBe( '0.01%' );
		expect( formatPercentage( 0.001 ) ).toBe( '0%' );
		expect( formatPercentage( 0.005 ) ).toBe( '0.01%' );
	} );

	it( 'handles edge cases', () => {
		expect( formatPercentage( 0 ) ).toBe( '0%' );
		expect( formatPercentage( 100 ) ).toBe( '100%' );
		expect( formatPercentage( 99.99 ) ).toBe( '99.99%' );
		expect( formatPercentage( 0.01 ) ).toBe( '0.01%' );
	} );
} );
