import { OPERATORS } from '../../../../../src/blocks/shared/conditional-logic/util/field-types';
import {
	OPERATOR_LABELS,
	getOperatorLabel,
} from '../../../../../src/blocks/shared/conditional-logic/util/operator-labels';

describe( 'operator labels', () => {
	it( 'labels every operator', () => {
		const operators = Object.values( OPERATORS );
		const labelled = Object.keys( OPERATOR_LABELS );
		expect( labelled.sort() ).toEqual( [ ...operators ].sort() );
	} );

	// Some labels legitimately read the same as their wire string ("is", "contains",
	// "equals"), so only blankness is a defect here.
	it( 'has no blank labels', () => {
		Object.values( OPERATOR_LABELS ).forEach( label => {
			expect( typeof label ).toBe( 'string' );
			expect( label.trim() ).not.toBe( '' );
		} );
	} );

	it( 'falls back to the wire string for an unknown operator', () => {
		expect( getOperatorLabel( 'not_a_real_operator' ) ).toBe( 'not_a_real_operator' );
	} );

	it( 'returns the label for a known operator', () => {
		expect( getOperatorLabel( OPERATORS.GREATER_THAN ) ).toBe( 'is greater than' );
	} );
} );
