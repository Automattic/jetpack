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

/**
 * Return the elements marked as invalid in the specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {NodeListOf<HTMLElement>} Invalid elements
 */
const getFormInvalidFields = form => {
	return form.querySelectorAll( '[aria-invalid]' );
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
 * UTILS
 ******************************************************************************/

/**
 * Return whether the form has inset labels (like with the Outlined and Animates styles).
 * @param {HTMLFormElement} form Form element
 * @returns {boolean}
 */
const hasFormInsetLabels = form => {
	const block = form.querySelector( '.wp-block-jetpack-contact-form' );

	if ( ! block ) {
		return;
	}

	const blockClassList = block.classList;

	return (
		blockClassList.contains( 'is-style-outlined' ) || blockClassList.contains( 'is-style-animated' )
	);
};

/**
 * Group radio inputs and checkbox inputs with multiple values.
 * Single inputs, checkbox groups and radio buttons handle validation and error
 * messages differently.
 * @param {NodeListOf<HTMLElement>} inputs Form inputs
 * @returns {object} Grouped inputs
 */
const groupFormInputs = inputs => {
	return inputs.reduce(
		( acc, input ) => {
			switch ( input.type ) {
				case 'radio':
					acc.radios.push( input );
					break;
				case 'checkbox':
					if ( input.name.indexOf( '[]' ) === input.name.length - 2 ) {
						acc.checkboxes.push( input );
					} else {
						// Handle checkbox inputs with a single value like other inputs.
						acc.default.push( input );
					}
					break;
				default:
					acc.default.push( input );
					break;
			}

			return acc;
		},
		{ default: [], radios: [], checkboxes: [] }
	);
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

	if ( formError ) {
		formError.textContent = '';
	}

	for ( const inputError of getFormInputErrors( form ) ) {
		inputError.textContent = '';
	}

	for ( const field of getFormInvalidFields( form ) ) {
		field.removeAttribute( 'aria-invalid' );
		field.removeAttribute( 'aria-describedby' );
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
	const opts = {
		hasInsetLabel: hasFormInsetLabels( form ),
	};
	const groupedInputs = groupFormInputs( getFormInputs( form ) );

	// Handle individual inputs
	for ( const input of groupedInputs.default ) {
		if ( ! input.validity.valid ) {
			setFormInputError( input, form, opts );
		}
	}

	// Handle radio buttons
	const radioButtonNames = groupedInputs.radios.reduce(
		( acc, input ) => ( acc.includes( input.name ) ? acc : [ ...acc, input.name ] ),
		[]
	);

	for ( const name of radioButtonNames ) {
		// Get the first radio button of the group.
		const input = form.querySelector( `input[type="radio"][name="${ name }"]` );

		// If one of the group radio buttons is checked, all radio buttons are valid.
		if ( ! input.validity.valid ) {
			setFormGroupInputError( input, form, opts );
		}
	}

	// Handle checkbox groups
	const checkboxNames = groupedInputs.checkboxes.reduce(
		( acc, input ) => ( acc.includes( input.name ) ? acc : [ ...acc, input.name ] ),
		[]
	);

	for ( const name of checkboxNames ) {
		// Get the first checkbox of the group.
		const input = form.querySelector( `input[type="checkbox"][name="${ name }"]` );
		const fieldset = input.closest( 'fieldset' );
		const isRequired = fieldset && fieldset.hasAttribute( 'data-required' );

		if ( isRequired ) {
			const formData = new FormData( form );

			if ( formData.getAll( name ).length === 0 ) {
				setFormGroupInputError( input, form, {
					...opts,
					message: L10N.checkboxMissingValue || 'Please select at least one option.',
				} );
			}
		}
	}
};

/**
 * Set the error element of the specified input.
 * @param {HTMLElement} input Input element
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Options
 */
const setFormInputError = ( input, form, opts ) => {
	const errorId = `${ input.name }-error`;
	let error = form.querySelector( `#${ errorId }` );

	if ( ! error ) {
		error = createFormInputErrorContainer( input, errorId );

		const wrap = input.closest(
			opts.hasInsetLabel ? '.contact-form__inset-label-wrap' : '.grunion-field-wrap'
		);

		if ( wrap ) {
			wrap.appendChild( error );
		}
	}

	error.replaceChildren( createError( input.validationMessage ) );

	input.setAttribute( 'aria-invalid', 'true' );
	input.setAttribute( 'aria-describedby', errorId );
};

/**
 * Set the error element of a group of inputs, i.e. a group of radio buttons or checkboxes.
 * These types of inputs are handled differently because the error message and invalidity
 * apply to the group as a whole, not to each individual input.
 * @param {HTMLElement} input An input element of the group
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Options
 */
const setFormGroupInputError = ( input, form, opts ) => {
	const errorId = `${ input.name.replace( '[]', '' ) }-error`;
	let error = form.querySelector( `#${ errorId }` );

	if ( ! error ) {
		error = createFormInputErrorContainer( input, errorId );
	}

	error.replaceChildren( createError( input.validationMessage || opts.message || 'Error' ) );

	const fieldset = input.closest( 'fieldset' );

	if ( fieldset ) {
		// Add the error after all the inputs.
		fieldset.appendChild( error );
		fieldset.setAttribute( 'aria-invalid', 'true' );
		fieldset.setAttribute( 'aria-describedby', errorId );
	}
};
