/**
 * @file Overwrites native form validation to provide an accessible experience to all users.
 */

const L10N = window.jetpackContactForm || {};

document.addEventListener( 'DOMContentLoaded', () => {
	initAllForms();
} );

/******************************************************************************
 * INITIALIZATION
 ******************************************************************************/

/**
 * Initialize all contact forms on the page.
 */
const initAllForms = () => {
	document
		.querySelectorAll( '.wp-block-jetpack-contact-form-container form.contact-form' )
		.forEach( initForm );
};

/**
 * Register event listeners on the specified form and disable native validation.
 * @param {HTMLFormElement} form Form element
 */
const initForm = form => {
	// Browsers don't all handle form validation in an accessible way.
	// Let's disable it and handle it ourselves.
	if ( ! form.hasAttribute( 'novalidate' ) ) {
		form.setAttribute( 'novalidate', true );
	}

	form.addEventListener( 'submit', e => {
		clearErrors( form );

		if ( form.checkValidity() ) {
			const submitBtn = getFormSubmitBtn( form );

			if ( submitBtn ) {
				// TODO: implement loading state
				// Temporarily prevents the user from submitting the form multiple times.
				submitBtn.disabled = true;
			}
		} else {
			e.preventDefault();

			setErrors( form );
		}
	} );
};

/******************************************************************************
 * GETTERS
 ******************************************************************************/

/**
 * Return the submit button of the specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {HTMLButtonElement|HTMLInputElement|undefined} Submit button
 */
const getFormSubmitBtn = form => {
	return (
		form.querySelector( 'input[type="submit"]' ) ||
		form.querySelector( 'button:not([type="reset"])' )
	);
};

/**
 * Return the inputs of the specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {NodeListOf<HTMLElement>} Form inputs
 */
const getFormInputs = form => {
	return [ ...form.elements ].filter(
		// input.offsetParent filters out inputs of which the parent is hidden.
		input => ! [ 'hidden', 'submit' ].includes( input.type ) && input.offsetParent !== null
	);
};

/**
 * Return the error element associated to the specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {HTMLElement|undefined} Error element
 */
const getFormError = form => {
	return form.querySelector( '.contact-form__error' );
};

/**
 * Return the error elements associated to the inputs of the specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {NodeListOf<HTMLElement>} Error elements
 */
const getFormInputErrors = form => {
	return form.querySelectorAll( '.contact-form__input-error' );
};

/******************************************************************************
 * BUILDERS
 ******************************************************************************/

/**
 * Create a new warning icon.
 * @returns {HTMLSpanElement} Warning icon
 */
const createWarningIcon = () => {
	const elt = document.createElement( 'span' );

	elt.classList.add( 'dashicons', 'dashicons-warning' );
	elt.setAttribute( 'aria-label', L10N.warning || 'Warning' );

	return elt;
};

/**
 * Create a new error text element.
 * @param {string} str Error message
 * @returns {HTMLSpanElement} Error text element
 */
const createErrorText = str => {
	const elt = document.createElement( 'span' );

	elt.textContent = str;

	return elt;
};

/**
 * Create a new error fragment.
 * @param {string} str Error message
 * @returns {DocumentFragment} Error fragment
 */
const createError = str => {
	const fragment = document.createDocumentFragment();

	fragment.appendChild( createWarningIcon() );
	fragment.appendChild( createErrorText( str ) );

	return fragment;
};

/**
 * Create a new error container for a form.
 * @returns {HTMLDivElement} Error container
 */
const createFormErrorContainer = () => {
	const elt = document.createElement( 'div' );

	elt.classList.add( 'contact-form__error' );
	elt.setAttribute( 'aria-live', 'assertive' );
	elt.setAttribute( 'role', 'alert' );

	return elt;
};

/**
 * Create a new error container for a form input.
 * @param {HTMLElement} input Input element
 * @param {string} errorId Error element ID
 * @returns {HTMLDivElement} Error container
 */
const createFormInputErrorContainer = ( input, errorId ) => {
	const elt = document.createElement( 'div' );

	elt.id = errorId;
	elt.classList.add( 'contact-form__input-error' );

	return elt;
};

/******************************************************************************
 * DOM UPDATES
 ******************************************************************************/

/**
 * Empty the error element of the specified form and its inputs and mark the latter as valid.
 * @param {HTMLFormElement} form Form element
 */
const clearErrors = form => {
	const formError = getFormError( form );
	const inputErrors = getFormInputErrors( form );
	const inputs = getFormInputs( form );

	if ( formError ) {
		formError.textContent = '';
	}

	for ( const inputError of inputErrors ) {
		inputError.textContent = '';
	}

	for ( const input of inputs ) {
		input.removeAttribute( 'aria-invalid' );
		input.removeAttribute( 'aria-describedby' );
	}
};

/**
 * Set the errors of the specified form and its inputs.
 * @param {HTMLFormElement} form Form element
 */
const setErrors = form => {
	setFormError( form );
	setFormInputErrors( form );
};

/**
 * Set the error element of the specified form.
 * @param {HTMLFormElement} form Form element
 */
const setFormError = form => {
	const submitBtn = getFormSubmitBtn( form );

	// Bail out, something's wrong with the form.
	if ( ! submitBtn ) {
		return;
	}

	let error = getFormError( form );

	if ( ! error ) {
		error = createFormErrorContainer( form );

		submitBtn.parentNode.insertBefore( error, submitBtn );
	}

	error.appendChild(
		createError( L10N.invalidForm || 'Please make sure all fields are correct.' )
	);
};

/**
 * Set the error elements of the inputs of the specified form.
 * @param {HTMLFormElement} form Form element
 */
const setFormInputErrors = form => {
	const inputs = getFormInputs( form );

	for ( const input of inputs ) {
		if ( input.validity.valid ) {
			continue;
		}

		const errorId = `${ input.id || input.name }-error`;
		let error = form.querySelector( `#${ errorId }` );

		if ( ! error ) {
			error = createFormInputErrorContainer( input, errorId );

			if ( input.classList.contains( 'contact-form-dropdown' ) ) {
				// The current implementation uses jQuery UI selectmenu, which hides the original select
				// tag and replaces it with a button and a list of options. Here we make sure the error
				// is inserted after the button.
				input.parentNode.appendChild( error );
			} else if ( input.type === 'radio' ) {
				const container = input.closest( '.grunion-radio-options' );

				if ( container ) {
					// Add the error after all the radio buttons.
					container.appendChild( error );
				}
			} else {
				input.parentNode.insertBefore( error, input.nextSibling );
			}
		}

		error.replaceChildren( createError( input.validationMessage ) );

		input.setAttribute( 'aria-invalid', 'true' );
		input.setAttribute( 'aria-describedby', errorId );
	}
};
