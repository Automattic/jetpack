import { formatReading, isInvalidReading } from '../readings';

describe( 'isInvalidReading', () => {
	test( 'accepts a number, including zero', () => {
		expect( isInvalidReading( 0, { allowMissing: false } ) ).toBe( false );
		expect( isInvalidReading( 42, { allowMissing: false } ) ).toBe( false );
	} );

	test( 'rejects undefined and NaN whether or not missing readings are allowed', () => {
		expect( isInvalidReading( undefined, { allowMissing: true } ) ).toBe( true );
		expect( isInvalidReading( NaN, { allowMissing: true } ) ).toBe( true );
	} );

	test( 'accepts null only where missing readings are allowed', () => {
		expect( isInvalidReading( null, { allowMissing: true } ) ).toBe( false );
		expect( isInvalidReading( null, { allowMissing: false } ) ).toBe( true );
	} );
} );

describe( 'formatReading', () => {
	test( 'reads a missing value as No data', () => {
		expect( formatReading( null ) ).toBe( 'No data' );
		expect( formatReading( undefined ) ).toBe( 'No data' );
	} );

	test( 'formats a real zero as zero', () => {
		expect( formatReading( 0 ) ).toBe( '0' );
	} );
} );
