import {
	OPERATORS,
	canValueCarryOver,
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
	[ 'rating', 'options' ],
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
	// Compares like a number, but offers its own scale as the values.
	rating: [
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

/**
 * Whether a value already typed survives choosing a subject.
 *
 * Choosing one used to clear the value outright, so anything typed first was lost -- and the
 * value box is offered before a subject is picked, so typing it first is a normal way to work.
 * The counter-risk is keeping a value the new subject's control cannot show: the box would
 * look empty while the evaluators went on comparing against it.
 */
describe( 'canValueCarryOver', () => {
	it( 'keeps a value a text box can show', () => {
		expect( canValueCarryOver( 'iPhone', 'string' ) ).toBe( true );
		expect( canValueCarryOver( 'iPhone', 'hidden' ) ).toBe( true );
	} );

	it( 'has nothing to keep when the value is blank', () => {
		expect( canValueCarryOver( '', 'string' ) ).toBe( false );
		expect( canValueCarryOver( '   ', 'string' ) ).toBe( false );
		expect( canValueCarryOver( null, 'string' ) ).toBe( false );
		expect( canValueCarryOver( undefined, 'string' ) ).toBe( false );
	} );

	it( 'drops it for a subject that takes no value at all', () => {
		expect( canValueCarryOver( 'iPhone', 'boolean' ) ).toBe( false );
		expect( canValueCarryOver( 'iPhone', 'file' ) ).toBe( false );
	} );

	it( 'keeps it for a dropdown only when it is one of the options', () => {
		const options = [ { value: 'Small' }, { value: 'Large' } ];

		expect( canValueCarryOver( 'Small', 'choice', options ) ).toBe( true );
		expect( canValueCarryOver( 'Medium', 'choice', options ) ).toBe( false );
		// A subject whose options have not been filled in yet can show nothing.
		expect( canValueCarryOver( 'Small', 'choice' ) ).toBe( false );
	} );

	it( 'keeps it for a number subject only when it is a number', () => {
		expect( canValueCarryOver( '10', 'number' ) ).toBe( true );
		expect( canValueCarryOver( '-2.5', 'number' ) ).toBe( true );
		expect( canValueCarryOver( 'ten', 'number' ) ).toBe( false );
	} );

	// A date or time input renders nothing for a value outside its format, so a carried-over
	// value that does not parse would be invisible rather than merely wrong.
	it( 'keeps it for date and time only in the format their inputs use', () => {
		expect( canValueCarryOver( '2026-03-15', 'date' ) ).toBe( true );
		expect( canValueCarryOver( '15/03/2026', 'date' ) ).toBe( false );
		expect( canValueCarryOver( '09:30', 'time' ) ).toBe( true );
		expect( canValueCarryOver( '09:30:00', 'time' ) ).toBe( true );
		expect( canValueCarryOver( 'half nine', 'time' ) ).toBe( false );
	} );
} );
