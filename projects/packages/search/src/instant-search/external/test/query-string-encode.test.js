import { encode, flatten } from '../query-string-encode';

describe( 'flatten', () => {
	test( 'flattens nested objects and arrays and skips null values', () => {
		expect( flatten( { a: { b: [ 1, { c: 2 } ], d: null }, e: 'x', f: [] } ) ).toEqual( {
			'a[b][0]': 1,
			'a[b][1][c]': 2,
			e: 'x',
		} );
	} );
} );

describe( 'encode', () => {
	test( 'encodes keys and values, repeats array keys and skips undefined', () => {
		expect( encode( { 'a b': 'c&d', arr: [ 1, 2 ], skip: undefined, n: 0 } ) ).toBe(
			'a%20b=c%26d&arr=1&arr=2&n=0'
		);
	} );
} );
