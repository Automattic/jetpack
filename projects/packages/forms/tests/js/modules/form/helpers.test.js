import { describe, expect, it } from '@jest/globals';
import { getSubmissionDisplayValue, isCheckedValue } from '../../../../src/modules/form/helpers.js';

/**
 * The confirmation summary an AJAX submission builds in the browser. It has to produce the
 * same strings `Contact_Form::get_submission_display_value()` rendered server-side, or the
 * summary changes as the Interactivity API hydrates over it.
 */
describe( 'isCheckedValue', () => {
	it( 'treats a submitted answer as ticked', () => {
		expect( isCheckedValue( 'Yes' ) ).toBe( true );
		expect( isCheckedValue( [ 'a' ] ) ).toBe( true );
	} );

	// An unticked box submits nothing at all; older stored responses carry an explicit "No".
	it( 'treats an empty value or an explicit no as unticked', () => {
		expect( isCheckedValue( '' ) ).toBe( false );
		expect( isCheckedValue( '   ' ) ).toBe( false );
		expect( isCheckedValue( 'No' ) ).toBe( false );
		expect( isCheckedValue( '0' ) ).toBe( false );
		expect( isCheckedValue( null ) ).toBe( false );
		expect( isCheckedValue( undefined ) ).toBe( false );
		expect( isCheckedValue( [] ) ).toBe( false );
	} );
} );

describe( 'getSubmissionDisplayValue', () => {
	/**
	 * The gap this closes: an unticked checkbox used to draw its label over a blank line,
	 * which reads as a field that failed to record rather than as the answer "no".
	 */
	it( 'names the answer an unticked checkbox gave', () => {
		expect( getSubmissionDisplayValue( '', 'checkbox', 'No' ) ).toBe( 'No' );
		expect( getSubmissionDisplayValue( undefined, 'checkbox', 'No' ) ).toBe( 'No' );
	} );

	it( 'leaves a ticked checkbox showing what was submitted', () => {
		expect( getSubmissionDisplayValue( 'Yes', 'checkbox', 'No' ) ).toBe( 'Yes' );
	} );

	// Only the checkbox is treated this way. An empty text field really is unanswered, and
	// consent keeps its own wording.
	it( 'leaves every other field type alone', () => {
		expect( getSubmissionDisplayValue( '', 'text', 'No' ) ).toBe( '' );
		expect( getSubmissionDisplayValue( '', 'consent', 'No' ) ).toBe( '' );
	} );
} );
