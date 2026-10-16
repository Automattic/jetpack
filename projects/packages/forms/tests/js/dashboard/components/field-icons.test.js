import { describe, expect, test } from '@jest/globals';
import {
	checkboxUncheckedFieldIcon,
	fieldIcons,
	isCheckedValue,
} from '../../../../src/dashboard/components/inspector/response-fields/field-icons.tsx';

/**
 * The dashboard picks a checkbox response's icon from the submitted value, so
 * this predicate has to agree with `Feedback_Field::is_checked_value()` in PHP —
 * the two render the same response on different surfaces.
 */
describe( 'isCheckedValue', () => {
	test( 'treats any non-empty answer as ticked', () => {
		// The stored value is a translated string, so we cannot match on "Yes".
		for ( const value of [ 'Yes', 'Oui', '1', 'true', [ 'a' ] ] ) {
			expect( isCheckedValue( value ) ).toBe( true );
		}
	} );

	test( 'treats empty answers and "no" as unticked', () => {
		for ( const value of [ '', '   ', null, undefined, [], 'no', 'No', ' NO ', '0' ] ) {
			expect( isCheckedValue( value ) ).toBe( false );
		}
	} );
} );

describe( 'checkbox field icons', () => {
	test( 'the unchecked variant is distinct from the checkbox type icon', () => {
		expect( checkboxUncheckedFieldIcon ).toBeTruthy();
		expect( checkboxUncheckedFieldIcon ).not.toBe( fieldIcons.checkbox );
	} );
} );
