import { describe, expect, test } from '@jest/globals';
import formatNumber from '../src/format-number';

describe( 'formatNumber', () => {
	test( 'converts a number to a string', () => {
		expect( formatNumber( 42 ) ).toBe( '42' );
		expect( formatNumber( 3.14 ) ).toBe( '3.14' );
		expect( formatNumber( -123 ) ).toBe( '-123' );
	} );
} );
