import { readFileSync } from 'fs';
import path from 'path';
import {
	evaluateLogic,
	resolveVisibility,
} from '../../../../../src/blocks/shared/conditional-logic/util/evaluate';

const logic = ( rules, extra = {} ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	controls: { fieldValue: { rules } },
	...extra,
} );

const one = ( operator, value, field = 'a' ) => logic( [ { field, operator, value } ] );

describe( 'evaluateLogic — string operators', () => {
	const types = { a: 'text' };

	it.each( [
		[ 'is', 'yes', 'yes', true ],
		[ 'is', 'yes', 'no', false ],
		[ 'is_not', 'yes', 'no', true ],
		[ 'is_not', 'yes', 'yes', false ],
		[ 'contains', 'blueberry', 'blue', true ],
		[ 'contains', 'blueberry', 'red', false ],
		[ 'does_not_contain', 'blueberry', 'red', true ],
		[ 'does_not_contain', 'blueberry', 'blue', false ],
	] )( '%s: %p vs %p', ( operator, actual, expected, want ) => {
		expect( evaluateLogic( one( operator, expected ), types, { a: actual } ) ).toBe( want );
	} );

	it.each( [
		[ 'is_empty', '', true ],
		[ 'is_empty', '   ', true ],
		[ 'is_empty', 'x', false ],
		[ 'is_not_empty', 'x', true ],
		[ 'is_not_empty', '', false ],
	] )( '%s: %p', ( operator, actual, want ) => {
		expect( evaluateLogic( one( operator, '' ), types, { a: actual } ) ).toBe( want );
	} );
} );

describe( 'evaluateLogic — multiple choice uses membership', () => {
	const types = { a: 'checkbox-multiple' };

	it( 'does not match a longer option that merely contains the value', () => {
		expect( evaluateLogic( one( 'contains', 'Blue' ), types, { a: [ 'Blueberry' ] } ) ).toBe(
			false
		);
	} );

	it( 'matches an exact selected option', () => {
		expect( evaluateLogic( one( 'contains', 'Blue' ), types, { a: [ 'Blue', 'Red' ] } ) ).toBe(
			true
		);
	} );

	it( 'handles does_not_contain', () => {
		expect( evaluateLogic( one( 'does_not_contain', 'Blue' ), types, { a: [ 'Red' ] } ) ).toBe(
			true
		);
		expect( evaluateLogic( one( 'does_not_contain', 'Blue' ), types, { a: [ 'Blue' ] } ) ).toBe(
			false
		);
	} );

	it( 'is not fooled by a comma inside an option label', () => {
		expect( evaluateLogic( one( 'contains', 'Yes' ), types, { a: [ 'Yes, please' ] } ) ).toBe(
			false
		);
		expect(
			evaluateLogic( one( 'contains', 'Yes, please' ), types, { a: [ 'Yes, please' ] } )
		).toBe( true );
	} );

	it( 'treats an empty selection as empty', () => {
		expect( evaluateLogic( one( 'is_empty', '' ), types, { a: [] } ) ).toBe( true );
		expect( evaluateLogic( one( 'is_not_empty', '' ), types, { a: [ 'Blue' ] } ) ).toBe( true );
	} );

	it( 'accepts a single string selection', () => {
		expect( evaluateLogic( one( 'contains', 'Blue' ), types, { a: 'Blue' } ) ).toBe( true );
	} );
} );

describe( 'evaluateLogic — choice operators', () => {
	const types = { a: 'select' };

	it( 'compares the whole selected option', () => {
		expect( evaluateLogic( one( 'is', 'Blue' ), types, { a: 'Blue' } ) ).toBe( true );
		expect( evaluateLogic( one( 'is', 'Blue' ), types, { a: 'Blueberry' } ) ).toBe( false );
		expect( evaluateLogic( one( 'is_not', 'Blue' ), types, { a: 'Red' } ) ).toBe( true );
	} );
} );

describe( 'evaluateLogic — numeric operators', () => {
	const types = { a: 'number' };

	it.each( [
		[ 'equals', '10.0', '10', true ],
		[ 'equals', '11', '10', false ],
		[ 'not_equals', '11', '10', true ],
		[ 'greater_than', '20', '10', true ],
		[ 'greater_than', '10', '10', false ],
		[ 'less_than', '5', '10', true ],
		[ 'less_than', '10', '10', false ],
		[ 'gte', '10', '10', true ],
		[ 'gte', '9', '10', false ],
		[ 'lte', '10', '10', true ],
		[ 'lte', '11', '10', false ],
	] )( '%s: %p vs %p', ( operator, actual, expected, want ) => {
		expect( evaluateLogic( one( operator, expected ), types, { a: actual } ) ).toBe( want );
	} );

	it( 'fails the rule when either side is not numeric', () => {
		expect( evaluateLogic( one( 'greater_than', '10' ), types, { a: 'abc' } ) ).toBe( false );
		expect( evaluateLogic( one( 'greater_than', 'abc' ), types, { a: '20' } ) ).toBe( false );
		expect( evaluateLogic( one( 'greater_than', '10' ), types, { a: '' } ) ).toBe( false );
	} );

	it( 'compares numbers numerically, not as strings', () => {
		// '9' > '10' lexically, but 9 < 10 numerically.
		expect( evaluateLogic( one( 'greater_than', '10' ), types, { a: '9' } ) ).toBe( false );
	} );

	it( 'accepts real numbers as values', () => {
		expect( evaluateLogic( one( 'greater_than', 10 ), types, { a: 20 } ) ).toBe( true );
	} );
} );

describe( 'evaluateLogic — date and time operators', () => {
	it.each( [
		[ 'before', '2026-01-01', '2026-06-01', true ],
		[ 'before', '2026-12-01', '2026-06-01', false ],
		[ 'after', '2026-12-01', '2026-06-01', true ],
		[ 'after', '2026-01-01', '2026-06-01', false ],
		[ 'is', '2026-06-01', '2026-06-01', true ],
		[ 'is_not', '2026-06-02', '2026-06-01', true ],
	] )( 'date %s: %p vs %p', ( operator, actual, expected, want ) => {
		expect( evaluateLogic( one( operator, expected ), { a: 'date' }, { a: actual } ) ).toBe( want );
	} );

	it.each( [
		[ 'before', '09:00', '17:00', true ],
		[ 'after', '18:00', '17:00', true ],
		[ 'is', '17:00', '17:00', true ],
	] )( 'time %s: %p vs %p', ( operator, actual, expected, want ) => {
		expect( evaluateLogic( one( operator, expected ), { a: 'time' }, { a: actual } ) ).toBe( want );
	} );

	it( 'fails the rule when either side is unparseable', () => {
		expect( evaluateLogic( one( 'before', '2026-06-01' ), { a: 'date' }, { a: 'nonsense' } ) ).toBe(
			false
		);
		expect( evaluateLogic( one( 'before', 'nonsense' ), { a: 'date' }, { a: '2026-06-01' } ) ).toBe(
			false
		);
	} );
} );

describe( 'evaluateLogic — boolean operators', () => {
	const types = { a: 'checkbox' };

	it.each( [
		[ 'is_checked', true, true ],
		[ 'is_checked', false, false ],
		[ 'is_checked', '1', true ],
		[ 'is_checked', '', false ],
		[ 'is_not_checked', false, true ],
		[ 'is_not_checked', true, false ],
	] )( '%s: %p', ( operator, actual, want ) => {
		expect( evaluateLogic( logic( [ { field: 'a', operator } ] ), types, { a: actual } ) ).toBe(
			want
		);
	} );
} );

describe( 'evaluateLogic — combination, action, and ignored rules', () => {
	const types = { a: 'text', b: 'text' };
	const twoRules = [
		{ field: 'a', operator: 'is', value: 'x' },
		{ field: 'b', operator: 'is', value: 'y' },
	];

	it( 'honors any versus all', () => {
		const values = { a: 'x', b: 'nope' };
		expect( evaluateLogic( logic( twoRules, { logicalOperator: 'any' } ), types, values ) ).toBe(
			true
		);
		expect( evaluateLogic( logic( twoRules, { logicalOperator: 'all' } ), types, values ) ).toBe(
			false
		);
	} );

	it( 'inverts the outcome for the hide action', () => {
		expect( evaluateLogic( one( 'is', 'x' ), types, { a: 'x' } ) ).toBe( true );
		expect(
			evaluateLogic(
				logic( [ { field: 'a', operator: 'is', value: 'x' } ], { action: 'hide' } ),
				types,
				{
					a: 'x',
				}
			)
		).toBe( false );
	} );

	it( 'is visible when disabled, ruleless, or missing its control', () => {
		expect( evaluateLogic( logic( [] ), types, {} ) ).toBe( true );
		expect(
			evaluateLogic(
				logic( [ { field: 'a', operator: 'is', value: 'x' } ], { enabled: false } ),
				types,
				{}
			)
		).toBe( true );
		expect(
			evaluateLogic(
				{ enabled: true, action: 'show', logicalOperator: 'all', controls: {} },
				types,
				{}
			)
		).toBe( true );
		expect( evaluateLogic( null, types, {} ) ).toBe( true );
	} );

	it( 'ignores a rule whose subject field no longer exists', () => {
		// A deleted subject must not be compared against empty — that would make is_empty
		// spuriously true and hide the field because an unrelated block was removed.
		expect( evaluateLogic( one( 'is_empty', '', 'gone_field' ), types, {} ) ).toBe( true );
		expect( evaluateLogic( one( 'is', 'x', 'gone_field' ), types, {} ) ).toBe( true );
	} );

	it( 'ignores only the missing rule and still evaluates the rest', () => {
		const rules = [
			{ field: 'gone_field', operator: 'is', value: 'x' },
			{ field: 'a', operator: 'is', value: 'x' },
		];
		expect( evaluateLogic( logic( rules ), types, { a: 'x' } ) ).toBe( true );
		expect( evaluateLogic( logic( rules ), types, { a: 'nope' } ) ).toBe( false );
	} );

	it( 'ignores a rule with an unknown operator', () => {
		expect( evaluateLogic( one( 'not_a_real_operator', 'x' ), types, { a: 'x' } ) ).toBe( true );
	} );
} );

describe( 'resolveVisibility — cascade', () => {
	const chain = () => ( {
		a: { logic: null, type: 'text' },
		b: { logic: one( 'is', 'Other' ), type: 'text' },
		c: { logic: logic( [ { field: 'b', operator: 'is_not_empty' } ] ), type: 'text' },
	} );

	it( 'treats a hidden field as empty for downstream rules', () => {
		// A switched away from Other, so B hides. B still holds a stale value, but C must
		// not stay visible on the strength of an answer the visitor can no longer see.
		const visible = resolveVisibility( chain(), { a: 'Something else', b: 'xyz', c: '' } );
		expect( visible.b ).toBe( false );
		expect( visible.c ).toBe( false );
	} );

	it( 'keeps the chain visible when the trigger matches', () => {
		const visible = resolveVisibility( chain(), { a: 'Other', b: 'xyz', c: '' } );
		expect( visible.a ).toBe( true );
		expect( visible.b ).toBe( true );
		expect( visible.c ).toBe( true );
	} );

	it( 'fails open on a two-field cycle', () => {
		const fields = {
			a: { logic: logic( [ { field: 'b', operator: 'is_empty' } ] ), type: 'text' },
			b: { logic: logic( [ { field: 'a', operator: 'is_not_empty' } ] ), type: 'text' },
		};
		const visible = resolveVisibility( fields, { a: 'x', b: 'y' } );
		expect( visible.a ).toBe( true );
		expect( visible.b ).toBe( true );
	} );

	it( 'fails open on self-reference', () => {
		const fields = {
			a: { logic: logic( [ { field: 'a', operator: 'is_empty' } ] ), type: 'text' },
		};
		expect( resolveVisibility( fields, { a: 'x' } ).a ).toBe( true );
	} );

	it( 'marks every field visible when none has logic', () => {
		const fields = {
			a: { logic: null, type: 'text' },
			b: { logic: null, type: 'text' },
		};
		expect( resolveVisibility( fields, {} ) ).toEqual( { a: true, b: true } );
	} );

	it( 'resolves a three-deep chain in one call', () => {
		const fields = {
			a: { logic: null, type: 'text' },
			b: { logic: one( 'is', 'go' ), type: 'text' },
			c: { logic: logic( [ { field: 'b', operator: 'is_not_empty' } ] ), type: 'text' },
			d: { logic: logic( [ { field: 'c', operator: 'is_not_empty' } ] ), type: 'text' },
		};
		const visible = resolveVisibility( fields, { a: 'go', b: 'x', c: 'y', d: '' } );
		expect( visible ).toEqual( { a: true, b: true, c: true, d: true } );

		const hidden = resolveVisibility( fields, { a: 'stop', b: 'x', c: 'y', d: '' } );
		expect( hidden.b ).toBe( false );
		expect( hidden.c ).toBe( false );
		expect( hidden.d ).toBe( false );
	} );

	it( 'returns an entry for every field, including those without logic', () => {
		const visible = resolveVisibility( chain(), { a: 'Other', b: 'x', c: '' } );
		expect( Object.keys( visible ).sort() ).toEqual( [ 'a', 'b', 'c' ] );
	} );

	it( 'tolerates an empty field map', () => {
		expect( resolveVisibility( {}, {} ) ).toEqual( {} );
	} );

	/**
	 * The pass budget used to be clamped to a constant, so an acyclic chain deeper than the
	 * clamp ran out of passes, was read as circular, and failed open -- leaving fields
	 * visible that every rule said to hide. Mirrors the PHP case of the same name.
	 */
	it( 'resolves a chain deeper than the old pass cap', () => {
		const depth = 30;
		const fields = { f0: { type: 'text' } };
		const values = { f0: 'no' };

		for ( let i = 1; i <= depth; i++ ) {
			fields[ `f${ i }` ] = {
				type: 'text',
				logic: {
					enabled: true,
					action: 'show',
					logicalOperator: 'all',
					controls: {
						fieldValue: {
							rules: [ { field: `f${ i - 1 }`, operator: 'is', value: 'yes' } ],
						},
					},
				},
			};
			values[ `f${ i }` ] = 'yes';
		}

		const visible = resolveVisibility( fields, values );

		expect( visible.f0 ).toBe( true );
		for ( let i = 1; i <= depth; i++ ) {
			expect( visible[ `f${ i }` ] ).toBe( false );
		}
	} );
} );

/**
 * Behavioural parity with the PHP evaluator.
 *
 * The PHP-side parity test pins the shared vocabulary -- operator names and the field type
 * table -- but that is not where the two implementations drift: both the Date.parse/strtotime
 * disagreement and the consent value-shape bug passed it. This reads the same table
 * Conditional_Logic_Behaviour_Test.php does, so a comparison that behaves differently in the
 * two languages fails on one side.
 */
describe( 'behaviour parity with PHP', () => {
	const fixture = JSON.parse(
		readFileSync(
			path.join( process.cwd(), 'tests/fixtures/conditional-logic-behaviour.json' ),
			'utf8'
		)
	);

	it.each( fixture.cases.map( testCase => [ testCase.name, testCase ] ) )(
		'%s',
		( name, testCase ) => {
			const caseLogic = {
				enabled: true,
				action: 'show',
				logicalOperator: 'all',
				controls: {
					fieldValue: {
						rules: [
							{
								field: 'subject',
								operator: testCase.operator,
								value: testCase.value,
							},
						],
					},
				},
			};

			const visible = evaluateLogic(
				caseLogic,
				{ subject: testCase.type },
				{ subject: testCase.actual },
				testCase.format ? { subject: testCase.format } : {}
			);

			expect( visible ).toBe( testCase.visible );
		}
	);
} );
