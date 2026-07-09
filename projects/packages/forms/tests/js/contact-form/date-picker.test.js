/**
 * Tests for the contact form date picker's mobile keyboard behavior.
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
} );
