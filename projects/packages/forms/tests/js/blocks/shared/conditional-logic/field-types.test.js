import {
	OPERATORS,
	getOperatorsForTypeKey,
	getValueInputForTypeKey,
	operatorNeedsValue,
} from '../../../../../src/blocks/shared/conditional-logic/util/field-types';

/**
 * One row per comparison behavior: [ type key, value input kind ].
 *
 * Which block declares which type key is not asserted here — the blocks own that, and
 * block-names.test.js checks it against their source. This file covers what the type key
 * itself buys you: the operator set and the value input the rule builder renders.
 */
const CASES = [
	[ 'string', 'text' ],
	[ 'choice', 'options' ],
	[ 'multichoice', 'options' ],
	[ 'number', 'number' ],
	[ 'date', 'date' ],
	[ 'time', 'time' ],
	[ 'boolean', 'none' ],
	[ 'hidden', 'text' ],
	[ 'file', 'none' ],
];

const EXPECTED_OPERATORS = {
	string: [ 'is', 'is_not', 'contains', 'does_not_contain', 'is_empty', 'is_not_empty' ],
	choice: [ 'is', 'is_not', 'is_empty', 'is_not_empty' ],
	multichoice: [ 'contains', 'does_not_contain', 'is_empty', 'is_not_empty' ],
	number: [
		'equals',
		'not_equals',
		'greater_than',
		'less_than',
		'gte',
		'lte',
		'is_empty',
		'is_not_empty',
	],
	date: [ 'is', 'is_not', 'before', 'after' ],
	time: [ 'is', 'is_not', 'before', 'after' ],
	boolean: [ 'is_checked', 'is_not_checked' ],
	hidden: [ 'is', 'is_not', 'contains' ],
	file: [ 'is_empty', 'is_not_empty' ],
};

describe( 'field-types', () => {
	it( 'covers every comparison behavior a block can declare', () => {
		expect( CASES.map( ( [ typeKey ] ) => typeKey ).sort() ).toEqual(
			Object.keys( EXPECTED_OPERATORS ).sort()
		);
	} );

	it.each( CASES )( '%s renders a %s value input', ( typeKey, input ) => {
		expect( getValueInputForTypeKey( typeKey ) ).toBe( input );
	} );

	it.each( CASES )( '%s exposes its operator set', typeKey => {
		expect( getOperatorsForTypeKey( typeKey ) ).toEqual( EXPECTED_OPERATORS[ typeKey ] );
	} );

	it( 'returns an empty operator list for an unknown type key', () => {
		expect( getOperatorsForTypeKey( 'nonsense' ) ).toEqual( [] );
		expect( getValueInputForTypeKey( 'nonsense' ) ).toBe( 'text' );
	} );

	it( 'knows which operators take no value operand', () => {
		expect( operatorNeedsValue( OPERATORS.IS ) ).toBe( true );
		expect( operatorNeedsValue( OPERATORS.CONTAINS ) ).toBe( true );
		expect( operatorNeedsValue( OPERATORS.GREATER_THAN ) ).toBe( true );
		expect( operatorNeedsValue( OPERATORS.BEFORE ) ).toBe( true );
		expect( operatorNeedsValue( OPERATORS.IS_EMPTY ) ).toBe( false );
		expect( operatorNeedsValue( OPERATORS.IS_NOT_EMPTY ) ).toBe( false );
		expect( operatorNeedsValue( OPERATORS.IS_CHECKED ) ).toBe( false );
		expect( operatorNeedsValue( OPERATORS.IS_NOT_CHECKED ) ).toBe( false );
	} );
} );
