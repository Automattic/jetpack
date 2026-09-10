/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import FieldPreview from '../../../../../src/dashboard/components/inspector/response-fields/field-preview/index.tsx';

const noop = () => () => {};

const preview = field => render( <FieldPreview field={ field } onFilePreview={ noop } /> );

/**
 * The path the checkmark is drawn with, so only the ticked icon carries it. Both icons are
 * `aria-hidden`, which is right -- the value beside them says the same thing -- and leaves no
 * accessible query to reach them. `Contact_Form_Test` pins the server-rendered pair against
 * this same path.
 */
const CHECKMARK_PATH = 'M10.5171 16.4421';

/**
 * How a stored answer reads in the response detail pane.
 *
 * The gap this covers: an unticked checkbox submits nothing, so it fell through to the dash
 * that means "nothing was answered" -- but the respondent did answer, and the email renderer
 * has always said "No" here.
 */
describe( 'FieldPreview', () => {
	it( 'names the answer an unticked checkbox gave', () => {
		preview( { label: 'Send me a copy', value: '', type: 'checkbox' } );

		expect( screen.getByText( 'No' ) ).toBeInTheDocument();
		expect( screen.queryByText( '-' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves a ticked checkbox showing what was submitted', () => {
		preview( { label: 'Send me a copy', value: 'Yes', type: 'checkbox' } );

		expect( screen.getByText( 'Yes' ) ).toBeInTheDocument();
	} );

	// The icon and the value are two views of one answer, and the component now reads that
	// answer once and hands the verdict to both -- so a mistake there moves them apart.
	it( 'gives a ticked and an unticked checkbox different icons', () => {
		const { container: unticked } = preview( {
			label: 'Send me a copy',
			value: '',
			type: 'checkbox',
		} );
		const { container: ticked } = preview( {
			label: 'Send me a copy',
			value: 'Yes',
			type: 'checkbox',
		} );

		expect( ticked.innerHTML ).toContain( CHECKMARK_PATH );
		expect( unticked.innerHTML ).not.toContain( CHECKMARK_PATH );
	} );

	// Only the checkbox is treated this way: an empty text field really is unanswered.
	it( 'still shows a dash for a field nobody answered', () => {
		preview( { label: 'Name', value: '', type: 'text' } );

		expect( screen.getByText( '-' ) ).toBeInTheDocument();
	} );
} );
