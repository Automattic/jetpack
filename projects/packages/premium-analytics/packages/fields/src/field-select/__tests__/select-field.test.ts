/**
 * Internal dependencies
 */
import { fromSelectValue, toSelectItems } from '../select-field';
import type { Option } from '@jetpack-premium-analytics/externals';

const NUMERIC_ELEMENTS: Option[] = [
	{ value: 10, label: 'Ten' },
	{ value: 20, label: 'Twenty' },
];

const STRING_ELEMENTS: Option[] = [
	{ value: 'posts', label: 'Posts' },
	{ value: 'archives', label: 'Archives' },
];

describe( 'toSelectItems', () => {
	it( 'stringifies numeric option values for the select control', () => {
		expect( toSelectItems( NUMERIC_ELEMENTS ) ).toEqual( [
			{ value: '10', label: 'Ten' },
			{ value: '20', label: 'Twenty' },
		] );
	} );

	it( 'leaves string option values unchanged', () => {
		expect( toSelectItems( STRING_ELEMENTS ) ).toEqual( [
			{ value: 'posts', label: 'Posts' },
			{ value: 'archives', label: 'Archives' },
		] );
	} );
} );

describe( 'fromSelectValue', () => {
	it( 'restores the original numeric type on write', () => {
		const restored = fromSelectValue( NUMERIC_ELEMENTS, '20' );
		expect( restored ).toBe( 20 );
		expect( typeof restored ).toBe( 'number' );
	} );

	it( 'preserves string values', () => {
		expect( fromSelectValue( STRING_ELEMENTS, 'archives' ) ).toBe( 'archives' );
	} );

	it( 'falls back to the raw string when no element matches', () => {
		expect( fromSelectValue( NUMERIC_ELEMENTS, '99' ) ).toBe( '99' );
	} );

	it( 'round-trips every option through toSelectItems without coercion', () => {
		toSelectItems( NUMERIC_ELEMENTS ).forEach( ( item, index ) => {
			expect( fromSelectValue( NUMERIC_ELEMENTS, item.value ) ).toBe(
				NUMERIC_ELEMENTS[ index ].value
			);
		} );
	} );
} );
