import { formatNumber } from '@automattic/number-formatters';
import { formatMetric, formatRate } from '../format-metric';

const formattedCount = ( value: number ) => formatNumber( value );
const formattedRate = ( value: number ) =>
	formatNumber( value / 100, { numberFormatOptions: { style: 'percent' } } );

describe( 'formatMetric', () => {
	it( 'formats a number with locale grouping', () => {
		expect( formatMetric( 1234 ) ).toBe( formattedCount( 1234 ) );
	} );

	it( 'formats zero as a plain number, not the placeholder', () => {
		expect( formatMetric( 0 ) ).toBe( formattedCount( 0 ) );
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
		expect( formatRate( 58 ) ).toBe( formattedRate( 58 ) );
	} );

	it( 'rounds a fractional rate to the nearest whole number', () => {
		expect( formatRate( 57.6 ) ).toBe( formattedRate( 58 ) );
	} );

	it( 'formats zero as 0%, not the placeholder', () => {
		expect( formatRate( 0 ) ).toBe( formattedRate( 0 ) );
	} );

	it( 'returns an em dash for null', () => {
		expect( formatRate( null ) ).toBe( '—' );
	} );

	it( 'returns an em dash for undefined', () => {
		expect( formatRate( undefined ) ).toBe( '—' );
	} );
} );
