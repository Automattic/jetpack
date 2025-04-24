/**
 * Jetpack Contact Form Fullscreen Validator
 *
 * Handles form field validation in fullscreen mode to ensure
 * each step is validated before proceeding to the next one.
 */

/**
 * Validate a form field
 *
 * @param {HTMLElement} field - The field wrapper element
 * @return {boolean} - Whether the field is valid
 */
export function validateField( field ) {
	const inputs = field.querySelectorAll( 'input, textarea, select' );
	let isValid = true;

	for ( const input of inputs ) {
		// Skip fields that don't need validation
		if ( input.type === 'button' || input.type === 'submit' || input.type === 'hidden' ) {
			continue;
		}

		// Check required fields
		if ( input.required && ! input.value.trim() ) {
			isValid = false;
			showError( field, input, 'This field is required' );
			continue;
		}

		// Check email format
		if ( input.type === 'email' && input.value && ! isValidEmail( input.value ) ) {
			isValid = false;
			showError( field, input, 'Please enter a valid email address' );
			continue;
		}

		// Check URL format
		if ( input.type === 'url' && input.value && ! isValidURL( input.value ) ) {
			isValid = false;
			showError( field, input, 'Please enter a valid URL' );
			continue;
		}

		// Check telephone format
		if ( input.type === 'tel' && input.value && ! isValidTel( input.value ) ) {
			isValid = false;
			showError( field, input, 'Please enter a valid phone number' );
			continue;
		}

		// Check radio/checkbox groups
		if ( ( input.type === 'radio' || input.type === 'checkbox' ) && input.required ) {
			const name = input.name;
			const checked = field.querySelectorAll( `input[name="${ name }"]:checked` ).length > 0;

			if ( ! checked ) {
				isValid = false;
				showError( field, input, 'Please select an option' );
				continue;
			}
		}

		// If we got here, the field is valid
		clearError( field, input );
	}

	return isValid;
}

/**
 * Show an error message for a field
 *
 * @param {HTMLElement} field   - The field wrapper element
 * @param {HTMLElement} input   - The input element
 * @param {string}      message - The error message
 */
function showError( field, input, message ) {
	// Clear existing errors first
	clearError( field, input );

	// Create error message
	const errorElement = document.createElement( 'div' );
	errorElement.className = 'jetpack-contact-form-error-message';
	errorElement.textContent = message;

	// Add error class to input
	input.classList.add( 'has-error' );

	// Append error after the input
	input.parentNode.insertBefore( errorElement, input.nextSibling );
}

/**
 * Clear error messages for a field
 *
 * @param {HTMLElement} field - The field wrapper element
 * @param {HTMLElement} input - The input element
 */
function clearError( field, input ) {
	// Remove error class from input
	input.classList.remove( 'has-error' );

	// Remove error messages
	const errorMessages = field.querySelectorAll( '.jetpack-contact-form-error-message' );
	for ( const error of errorMessages ) {
		error.parentNode.removeChild( error );
	}
}

/**
 * Validate an email address
 *
 * @param {string} email - The email to validate
 * @return {boolean} - Whether the email is valid
 */
function isValidEmail( email ) {
	const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return pattern.test( email );
}

/**
 * Validate a URL
 *
 * @param {string} url - The URL to validate
 * @return {boolean} - Whether the URL is valid
 */
function isValidURL( url ) {
	try {
		new URL( url );
		return true;
	} catch ( e ) {
		return false;
	}
}

/**
 * Validate a telephone number
 *
 * @param {string} tel - The telephone number to validate
 * @return {boolean} - Whether the telephone number is valid
 */
function isValidTel( tel ) {
	// Allow a variety of formats, this is a simple check
	const pattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
	return pattern.test( tel.replace( /\s/g, '' ) );
}
