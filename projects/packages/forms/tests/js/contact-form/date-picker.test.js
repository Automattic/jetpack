/**
 * Tests for the contact form date picker's mobile keyboard behavior and for
 * the accessible name it must leave alone.
 *
 * On mobile, tapping the date field should open the date picker without
 * triggering the on-screen keyboard. We achieve this by marking the input
 * read-only on touch devices, which suppresses the virtual keyboard while
 * still allowing the field to receive focus and open the picker.
 */
import { DatePicker } from '../../../src/contact-form/libs/date-picker/date-picker.ts';

const MOBILE_UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
// iPadOS 13+ Safari requests desktop sites by default, reporting a "Macintosh"
// user agent that is indistinguishable from a Mac except for maxTouchPoints.
const IPADOS_UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

/**
 * Override the navigator user agent so isMobileDevice() can be exercised.
 *
 * @param {string} ua - The user agent string to report.
 */
function setUserAgent( ua ) {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: ua,
		configurable: true,
	} );
}

/**
 * Override navigator.maxTouchPoints to emulate touch vs non-touch hardware.
 *
 * @param {number} points - The number of simultaneous touch points to report.
 */
function setMaxTouchPoints( points ) {
	Object.defineProperty( window.navigator, 'maxTouchPoints', {
		value: points,
		configurable: true,
	} );
}

/**
 * Create a contact form date input attached to the document body.
 *
 * @return {HTMLInputElement} The date input element.
 */
function createInput() {
	const input = document.createElement( 'input' );
	input.type = 'text';
	input.className = 'jp-contact-form-date';
	document.body.appendChild( input );
	return input;
}

describe( 'contact form date picker', () => {
	let picker;
	let input;

	afterEach( () => {
		picker?.destroy();
		picker = undefined;
		input?.remove();
		input = undefined;
		document.body.innerHTML = '';
	} );

	describe( 'on mobile devices', () => {
		beforeEach( () => {
			setUserAgent( MOBILE_UA );
			setMaxTouchPoints( 5 );
			input = createInput();
		} );

		it( 'marks the input read-only on init so the first tap does not open the keyboard', () => {
			picker = DatePicker( input, {} );

			expect( input.readOnly ).toBe( true );
		} );

		it( 'keeps the input read-only after opening and closing the picker', () => {
			picker = DatePicker( input, {} );

			picker.open();
			picker.close();

			expect( input.readOnly ).toBe( true );
		} );
	} );

	describe( 'on iPadOS (desktop-class Safari user agent)', () => {
		beforeEach( () => {
			// iPadOS reports a Macintosh UA but, unlike a real Mac, exposes
			// touch points. The field must still be treated as mobile.
			setUserAgent( IPADOS_UA );
			setMaxTouchPoints( 5 );
			input = createInput();
		} );

		it( 'marks the input read-only on init despite the desktop-class user agent', () => {
			picker = DatePicker( input, {} );

			expect( input.readOnly ).toBe( true );
		} );
	} );

	describe( 'on desktop devices', () => {
		beforeEach( () => {
			setUserAgent( DESKTOP_UA );
			setMaxTouchPoints( 0 );
			input = createInput();
		} );

		it( 'leaves the input editable on init so users can type a date', () => {
			picker = DatePicker( input, {} );

			expect( input.readOnly ).toBe( false );
		} );

		it( 'keeps the input editable after opening and closing the picker', () => {
			picker = DatePicker( input, {} );

			picker.open();
			picker.close();

			expect( input.readOnly ).toBe( false );
		} );
	} );

	/*
	 * `aria-label` overrides `<label>`, so any value the picker puts on the input
	 * replaces the field's own label in the accessibility tree — however helpful
	 * the text is. The picker used to set one, which is why this is asserted
	 * rather than assumed.
	 *
	 * Each test asserts the computed name, not just the absence of an aria-label:
	 * the point is that the <label> wins, and only the positive assertion catches
	 * a regression that displaces it by some other means.
	 */
	describe( 'accessible name', () => {
		let label;

		beforeEach( () => {
			setUserAgent( DESKTOP_UA );
			setMaxTouchPoints( 0 );
			input = createInput();
			input.id = 'jp-date-field';

			// The field the picker attaches to is labelled server-side. That
			// label is the thing an aria-label on the input would displace.
			label = document.createElement( 'label' );
			label.setAttribute( 'for', input.id );
			label.textContent = 'Birthday';
			document.body.appendChild( label );
		} );

		afterEach( () => {
			label?.remove();
			label = undefined;
		} );

		it( 'lets the <label> name the input on attach', () => {
			picker = DatePicker( input, {} );

			expect( input ).toHaveAccessibleName( 'Birthday' );
			expect( input ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'lets the <label> name the input once the picker is open', () => {
			let opened = false;
			picker = DatePicker( input, {} );
			picker.on( 'open', () => {
				opened = true;
			} );

			picker.open();

			expect( opened ).toBe( true );
			expect( input ).toHaveAccessibleName( 'Birthday' );
			expect( input ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'lets the <label> name the input when the down arrow key opens the picker', () => {
			let opened = false;
			picker = DatePicker( input, {} );
			picker.on( 'open', () => {
				opened = true;
			} );

			input.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'ArrowDown', bubbles: true } ) );

			// Without this the test passes for any key the handler ignores, so it
			// would not notice the down-arrow binding breaking.
			expect( opened ).toBe( true );
			expect( input ).toHaveAccessibleName( 'Birthday' );
			expect( input ).not.toHaveAttribute( 'aria-label' );
		} );
	} );

	/*
	 * When block visibility hides a field's label, the server puts the name
	 * straight on the input via get_hidden_label_aria_label_attr(). That is the
	 * case the old behavior hurt most — the input's only name was the one the
	 * picker overwrote — so a legitimate server-supplied name must survive too.
	 */
	describe( 'accessible name when the field label is hidden', () => {
		beforeEach( () => {
			setUserAgent( DESKTOP_UA );
			setMaxTouchPoints( 0 );
			input = createInput();
			input.setAttribute( 'aria-label', 'Birthday' );
		} );

		it( 'leaves a server-supplied aria-label intact', () => {
			picker = DatePicker( input, {} );

			picker.open();

			expect( input ).toHaveAccessibleName( 'Birthday' );
		} );
	} );
} );
