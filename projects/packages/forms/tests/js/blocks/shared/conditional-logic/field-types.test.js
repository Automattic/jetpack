import {
	OPERATORS,
	getCarriedOverValue,
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
 * What a value already typed becomes when a subject is chosen. The risk on the other side of
 * keeping it is a value the new subject's control cannot show: an empty-looking box the
 * evaluators are still comparing against.
 */
describe( 'getCarriedOverValue', () => {
	it( 'keeps a value a text box can show', () => {
		expect( getCarriedOverValue( 'iPhone', 'string' ) ).toBe( 'iPhone' );
		expect( getCarriedOverValue( 'iPhone', 'hidden' ) ).toBe( 'iPhone' );
	} );

	/**
	 * The decision is made on the trimmed value, so the trimmed value is what comes back --
	 * returning the padded original left every control here unable to display it.
	 */
	it( 'returns the value in the form the control can show', () => {
		expect( getCarriedOverValue( '  iPhone  ', 'string' ) ).toBe( 'iPhone' );
		expect( getCarriedOverValue( ' 10 ', 'number' ) ).toBe( '10' );
		expect( getCarriedOverValue( ' 2026-03-15 ', 'date' ) ).toBe( '2026-03-15' );
		expect( getCarriedOverValue( ' 09:30 ', 'time' ) ).toBe( '09:30' );
		expect( getCarriedOverValue( '  Small  ', 'choice', [ { value: 'Small' } ] ) ).toBe( 'Small' );
	} );

	it( 'has nothing to keep when the value is blank', () => {
		expect( getCarriedOverValue( '', 'string' ) ).toBeNull();
		expect( getCarriedOverValue( '   ', 'string' ) ).toBeNull();
		expect( getCarriedOverValue( null, 'string' ) ).toBeNull();
		expect( getCarriedOverValue( undefined, 'string' ) ).toBeNull();
	} );

	it( 'drops it for a subject that takes no value at all', () => {
		expect( getCarriedOverValue( 'iPhone', 'boolean' ) ).toBeNull();
		expect( getCarriedOverValue( 'iPhone', 'file' ) ).toBeNull();
	} );

	it( 'keeps it for a dropdown only when it is one of the options', () => {
		const options = [ { value: 'Small' }, { value: 'Large' } ];

		expect( getCarriedOverValue( 'Small', 'choice', options ) ).toBe( 'Small' );
		expect( getCarriedOverValue( 'Medium', 'choice', options ) ).toBeNull();
		// A subject whose options have not been filled in yet can show nothing.
		expect( getCarriedOverValue( 'Small', 'choice' ) ).toBeNull();
	} );

	it( 'keeps it for a number subject only when it is a number', () => {
		expect( getCarriedOverValue( '10', 'number' ) ).toBe( '10' );
		expect( getCarriedOverValue( '-2.5', 'number' ) ).toBe( '-2.5' );
		expect( getCarriedOverValue( '1e3', 'number' ) ).toBe( '1e3' );
		expect( getCarriedOverValue( 'ten', 'number' ) ).toBeNull();
	} );

	// `Number()` reads all of these; a number input displays none of them, which is the
	// question being asked.
	it( 'drops a number the input cannot show, however readable it is to Number()', () => {
		expect( getCarriedOverValue( '0x10', 'number' ) ).toBeNull();
		expect( getCarriedOverValue( '.5', 'number' ) ).toBeNull();
		expect( getCarriedOverValue( '5.', 'number' ) ).toBeNull();
		expect( getCarriedOverValue( '+5', 'number' ) ).toBeNull();
	} );

	// Outside its own format, the input renders nothing at all.
	it( 'keeps it for date and time only in the format their inputs use', () => {
		expect( getCarriedOverValue( '2026-03-15', 'date' ) ).toBe( '2026-03-15' );
		expect( getCarriedOverValue( '15/03/2026', 'date' ) ).toBeNull();
		expect( getCarriedOverValue( '09:30', 'time' ) ).toBe( '09:30' );
		expect( getCarriedOverValue( '09:30:00', 'time' ) ).toBe( '09:30:00' );
		expect( getCarriedOverValue( 'half nine', 'time' ) ).toBeNull();
	} );

	// The format is not the whole question: a day that does not exist rolls over into the
	// next month rather than failing to parse, and the input shows nothing for it.
	it( 'drops a well-formed date or time that does not exist', () => {
		expect( getCarriedOverValue( '2024-02-29', 'date' ) ).toBe( '2024-02-29' );
		expect( getCarriedOverValue( '2026-02-29', 'date' ) ).toBeNull();
		expect( getCarriedOverValue( '2026-02-31', 'date' ) ).toBeNull();
		expect( getCarriedOverValue( '2026-13-01', 'date' ) ).toBeNull();
		expect( getCarriedOverValue( '23:59', 'time' ) ).toBe( '23:59' );
		expect( getCarriedOverValue( '24:00', 'time' ) ).toBeNull();
		expect( getCarriedOverValue( '09:99', 'time' ) ).toBeNull();
		expect( getCarriedOverValue( '09:30:99', 'time' ) ).toBeNull();
	} );
} );
