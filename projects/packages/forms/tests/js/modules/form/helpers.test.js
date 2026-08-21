import { describe, expect, it } from '@jest/globals';
import {
	getSubmissionDisplayValue,
	isCheckedValue,
	maybeAddColonToLabel,
	maybeTransformValue,
} from '../../../../src/modules/form/helpers.js';

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

/**
 * The shapes a stored field value arrives in, flattened to the one line a summary shows.
 *
 * Covered directly rather than through view.test.js's local copy of `setSubmissionData`,
 * which reimplements the surrounding logic and cannot be trusted to track this.
 */
describe( 'maybeTransformValue', () => {
	it( 'lists an image-select answer by its perceived values', () => {
		expect(
			maybeTransformValue( {
				type: 'image-select',
				choices: [ { perceived: 'A' }, { perceived: 'B' } ],
			} )
		).toBe( 'A, B' );
	} );

	// The choices can be shuffled per respondent, so the perceived letter is what identifies
	// one; the label is appended only where the field is set to show labels.
	it( 'appends an image label only when the field shows labels', () => {
		expect(
			maybeTransformValue( {
				type: 'image-select',
				choices: [
					{ perceived: 'A', showLabels: true, label: 'Bold' },
					{ perceived: 'B', showLabels: true, label: '' },
					{ perceived: 'C', showLabels: false, label: 'Hidden' },
				],
			} )
		).toBe( 'A - Bold, B, C' );
	} );

	it( 'unwraps a url field to its url', () => {
		expect( maybeTransformValue( { type: 'url', url: 'https://example.com' } ) ).toBe(
			'https://example.com'
		);
	} );

	it( 'shows a rating by its display value', () => {
		expect( maybeTransformValue( { type: 'rating', value: 3, displayValue: '3/5' } ) ).toBe(
			'3/5'
		);
	} );

	it( 'shows an uploaded file by name and size', () => {
		expect( maybeTransformValue( { name: 'notes.pdf', size: '2 MB' } ) ).toBe( 'notes.pdf (2 MB)' );
	} );

	it( 'passes anything else through untouched', () => {
		expect( maybeTransformValue( 'Ada' ) ).toBe( 'Ada' );
		expect( maybeTransformValue( '' ) ).toBe( '' );
		expect( maybeTransformValue( null ) ).toBeNull();
	} );
} );

describe( 'maybeAddColonToLabel', () => {
	it( 'ends a label with a colon', () => {
		expect( maybeAddColonToLabel( 'Name' ) ).toBe( 'Name:' );
	} );

	// The Terms consent block's text ends in a period, and a question keeps its mark.
	it( 'replaces a trailing period and leaves a question alone', () => {
		expect( maybeAddColonToLabel( 'I agree to the terms.' ) ).toBe( 'I agree to the terms:' );
		expect( maybeAddColonToLabel( 'Already a colon:' ) ).toBe( 'Already a colon:' );
		expect( maybeAddColonToLabel( 'How did you hear about us?' ) ).toBe(
			'How did you hear about us?'
		);
	} );

	it( 'has nothing to punctuate for an empty label', () => {
		expect( maybeAddColonToLabel( '' ) ).toBeNull();
		expect( maybeAddColonToLabel( undefined ) ).toBeNull();
	} );
} );
