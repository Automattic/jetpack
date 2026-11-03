import {
	describeRule,
	getActiveConditions,
	getSummaryHeading,
	getSummaryText,
} from '../../../../../src/blocks/shared/conditional-logic/util/summary.js';

const FIELDS = [
	{ clientId: 'c-phone', id: 'phone', label: 'Phone', typeKey: 'choice', options: [] },
	{ clientId: 'c-email', id: 'email', label: 'Email', typeKey: 'string', options: [] },
];

const group = ( rules, logicalOperator = 'all' ) => ( { logicalOperator, rules } );

describe( 'getSummaryHeading', () => {
	// Four separate strings rather than one assembled from fragments: a sentence built by
	// concatenation cannot be reordered by a translator.
	it.each( [
		[ 'show', 'all', 'This field is shown only if:' ],
		[ 'show', 'any', 'This field is shown if any of these are true:' ],
		[ 'hide', 'all', 'This field is hidden only if:' ],
		[ 'hide', 'any', 'This field is hidden if any of these are true:' ],
	] )( '%s + %s reads "%s"', ( action, logicalOperator, expected ) => {
		expect( getSummaryHeading( { action }, { logicalOperator } ) ).toBe( expected );
	} );
} );

describe( 'describeRule', () => {
	it( 'reads as the sentence the author built', () => {
		expect( describeRule( { field: 'phone', operator: 'is', value: 'iPhone' }, FIELDS[ 0 ] ) ).toBe(
			'Phone is “iPhone”'
		);
	} );

	// `is empty` and friends compare against nothing, so there is nothing to quote after them.
	it( 'leaves off the value for an operator that takes none', () => {
		expect( describeRule( { field: 'email', operator: 'is_not_empty' }, FIELDS[ 1 ] ) ).toBe(
			'Email is not empty'
		);
	} );
} );

describe( 'getActiveConditions', () => {
	// An incomplete rule is skipped by both evaluators, so listing it would describe behaviour
	// the field does not have.
	it( 'lists only the conditions that will be acted on', () => {
		const active = getActiveConditions(
			group( [
				{ field: 'phone', operator: 'is', value: 'iPhone' },
				{ field: 'email', operator: 'is', value: '' },
				{ field: 'gone', operator: 'is', value: 'x' },
			] ),
			FIELDS
		);

		expect( active ).toHaveLength( 1 );
		expect( active[ 0 ].subject.label ).toBe( 'Phone' );
	} );
} );

describe( 'getSummaryText', () => {
	it( 'says the same thing on one line, for the toolbar tooltip', () => {
		expect(
			getSummaryText(
				{ action: 'show' },
				group( [
					{ field: 'phone', operator: 'is', value: 'iPhone' },
					{ field: 'email', operator: 'is_not_empty' },
				] ),
				FIELDS
			)
		).toBe( 'This field is shown only if: Phone is “iPhone”; Email is not empty' );
	} );

	it( 'is empty when nothing is active', () => {
		expect( getSummaryText( { action: 'show' }, group( [] ), FIELDS ) ).toBe( '' );
	} );
} );
