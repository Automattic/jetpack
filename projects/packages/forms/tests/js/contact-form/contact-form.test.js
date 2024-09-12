/**
 * @jest-environment jsdom
 */

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
				<input id="name" name="name" required />
				<button type="submit">Submit</button>
			` );
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

		it( "shouldn't submit an invalid form", () => {
			const form = screen.getByRole( 'form' );
			const spy = jest.spyOn( form, 'submit' ).mockImplementation( () => {} );

			fireEvent.submit( form );

			expect( spy ).not.toHaveBeenCalled();
		} );
	} );
} );
