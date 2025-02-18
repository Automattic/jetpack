/**
 * @jest-environment jsdom
 */

import userEvent from '@testing-library/user-event';
// eslint-disable-next-line testing-library/no-dom-import -- Not actually React code.
const { screen, fireEvent } = require( '@testing-library/dom' );

/*
 * Helpers
 */
const fireDomReadyEvent = () =>
	fireEvent(
		document,
		new Event( 'DOMContentLoaded', {
			bubbles: true,
			cancelable: true,
		} )
	);

const setFormContent = html =>
	( document.body.innerHTML = `
	<div class="wp-block-jetpack-contact-form-container">
		<form class="contact-form" aria-label="Test">
			${ html }
		</form>
	</div>
` );

/**
 * Test Suites
 */
describe( 'Contact Form', () => {
	let originalWp;

	/*
	 * Setup
	 */
	beforeAll( () => {
		originalWp = global.wp;
		global.wp = {
			i18n: {
				__: str => str,
				// Implementation of _n might need to be updated with future tests.
				_n: str => str,
			},
		};

		require( '../../../src/contact-form/js/accessible-form.js' );
	} );

	/*
	 * Teardown
	 */
	afterAll( () => {
		global.wp = originalWp;
	} );

	/*
	 * Tests
	 */
	describe( 'Native validation', () => {
		beforeEach( () => {
			setFormContent( '' );
			fireDomReadyEvent();
		} );

		it( 'should disable native validation', () => {
			const form = screen.getByRole( 'form' );

			// eslint-disable-next-line jest-dom/prefer-to-have-attribute
			expect( form.getAttribute( 'novalidate' ) ).toBe( 'true' );
		} );
	} );

	describe( 'Form submission', () => {
		beforeEach( () => {
			setFormContent( `
				<label for="name">Name</label>
				<input id="name" name="name">
				<button type="submit">Submit</button>
			` );
			// Mock offsetParent for all elements
			Object.defineProperty( HTMLElement.prototype, 'offsetParent', {
				get() {
					return {};
				}, // Return a truthy value
			} );
			fireDomReadyEvent();
		} );

		afterEach( () => {
			jest.restoreAllMocks();
		} );

		it( 'should submit a valid form once', () => {
			const form = screen.getByRole( 'form' );
			const input = screen.getByLabelText( 'Name' );
			const spy = jest.spyOn( form, 'submit' ).mockImplementation( () => {} );

			input.value = 'abc';

			for ( let i = 0; i < 3; i++ ) {
				fireEvent.submit( form );
			}

			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( "shouldn't submit form with missing required fields", () => {
			const form = screen.getByRole( 'form' );
			const input = screen.getByLabelText( 'Name' );
			input.setAttribute( 'required', '' );
			const spy = jest.spyOn( form, 'submit' ).mockImplementation( () => {} );

			fireEvent.submit( form );

			expect( spy ).not.toHaveBeenCalled();
		} );

		it( "shouldn't submit when all fields are empty", () => {
			const form = screen.getByRole( 'form' );
			const spy = jest.spyOn( form, 'submit' ).mockImplementation( () => {} );

			fireEvent.submit( form );

			expect( spy ).not.toHaveBeenCalled();
		} );
	} );
	// @see https://github.com/Automattic/jetpack/issues/41834.
	it( 'should properly handle `select` elements when checking if a form is empty', async () => {
		setFormContent( `
			<div style="" class="grunion-field-select-wrap grunion-field-wrap">
				<label for="g-name" class="grunion-field-label select">Name</label>
				<div class="contact-form__select-wrapper">
					<select data-testid="select-test" name="g-name" id="g-name" class="select  grunion-field">
						<option value="">Select one option</option>
						<option value="0">zero</option>
						<option value="1">one</option>
					</select>
				</div>
			</div>
			<button type="submit">Submit</button>
		` );
		fireDomReadyEvent();

		const form = screen.getByRole( 'form' );
		const spy = jest.spyOn( form, 'submit' ).mockImplementation( () => {} );
		fireEvent.submit( form );
		expect( spy ).not.toHaveBeenCalled();

		// Select a value.
		await userEvent.selectOptions(
			screen.getByRole( 'combobox' ),
			screen.getByRole( 'option', { name: 'zero' } )
		);
		fireEvent.submit( form );
		expect( spy ).toHaveBeenCalled();

		jest.restoreAllMocks();
	} );
} );
