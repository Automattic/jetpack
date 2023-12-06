/**
 * @file Overwrites native form validation to provide an accessible experience to all users.
 *
 * In the code below, be aware that the terms "input" and "field" mean different things. An input
 * refers to a UI element a user can interact with, such as a text field or a checbkox. A field
 * represents a question of a form and can hold multiple inputs, such as the Single Choice
 * (multiple radio buttons) or Multiple Choice fields (multiple checkboxes).
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
 * Implement a form custom validation.
 * @param {HTMLFormElement} form Form element
 */
const initForm = form => {
	// Browsers don't all handle form validation in an accessible way.
	// Let's disable it and handle it ourselves.
	if ( ! form.hasAttribute( 'novalidate' ) ) {
		form.setAttribute( 'novalidate', true );
	}

	const opts = {
		hasInsetLabel: hasFormInsetLabels( form ),
	};

	form.addEventListener( 'submit', e => {
		e.preventDefault();

		// Prevent multiple submissions.
		if ( isFormSubmitting( form ) ) {
			return;
		}

		clearForm( form, opts );

		if ( form.checkValidity() ) {
			submitForm( form );
		} else {
			invalidateForm( form, opts );
		}
	} );
};

/******************************************************************************
 * CHECKS
 ******************************************************************************/

/**
 * Check if a form is submitting.
 * @param {HTMLFormElement} form Form element
 * @returns {boolean}
 */
const isFormSubmitting = form => {
	return form.getAttribute( 'data-submitting' ) === true;
};

/**
 * Check if an element is a Multiple Choice field (i.e., a fieldset with checkboxes).
 * @param {HTMLElement} elt Element
 * @returns {boolean}
 */
const isMultipleChoiceField = elt => {
	return (
		elt.tagName.toLowerCase() === 'fieldset' &&
		elt.classList.contains( 'grunion-checkbox-multiple-options' )
	);
};

/**
 * Check if an element is a Single Choice field (i.e., a fieldset with radio buttons).
 * @param {HTMLElement} elt Element
 * @returns {boolean}
 */
const isSingleChoiceField = elt => {
	return (
		elt.tagName.toLowerCase() === 'fieldset' && elt.classList.contains( 'grunion-radio-options' )
	);
};

/**
 * Check if a Multiple Choice field is required.
 * @param {HTMLFieldSetElementi} fieldset Fieldset element
 * @returns {boolean}
 */
const isMultipleChoiceFieldRequired = fieldset => {
	// Unlike radio buttons, we can't use the `required` attribute on checkboxes.
	return fieldset.hasAttribute( 'data-required' );
};

/**
 * Check if a simple field (with a single input) is valid.
 * @param {HTMLElement} input Field input element
 * @returns {boolean}
 */
const isSimpleFieldValid = input => {
	return input.validity.valid;
};

/**
 * Check if a required single choice field (with radio buttons) is valid.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 * @returns {boolean}
 */
const isSingleChoiceFieldValid = fieldset => {
	const inputs = Array.from( fieldset.querySelectorAll( 'input[type="radio"]' ) );

	if ( inputs.length > 0 ) {
		return inputs.every( input => input.validity.valid );
	}

	return false;
};

/**
 * Check if a required multiple choice field (with checkboxes) is valid.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 * @returns {boolean}
 */
const isMultipleChoiceFieldValid = fieldset => {
	if ( ! isMultipleChoiceFieldRequired( fieldset ) ) {
		return true;
	}

	const inputs = Array.from( fieldset.querySelectorAll( 'input[type="checkbox"]' ) );

	if ( inputs.length > 0 ) {
		return inputs.some( input => input.checked );
	}

	return false;
};

/**
 * Return whether a form has inset labels (like with the Outlined and Animates styles).
 * @param {HTMLFormElement} form Form element
 * @returns {boolean}
 */
const hasFormInsetLabels = form => {
	// The style "container" is insde the form.
	const block = form.querySelector( '.wp-block-jetpack-contact-form' );

	if ( ! block ) {
		return false;
	}

	const blockClassList = block.classList;

	return (
		blockClassList.contains( 'is-style-outlined' ) || blockClassList.contains( 'is-style-animated' )
	);
};

/******************************************************************************
 * GETTERS
 ******************************************************************************/

/**
 * Return the submit button of a form.
 * @param {HTMLFormElement} form Form element
 * @returns {HTMLButtonElement|HTMLInputElement|undefined} Submit button
 */
const getFormSubmitBtn = form => {
	return (
		form.querySelector( '[type="submit"]' ) || form.querySelector( 'button:not([type="reset"])' )
	);
};

/**
 * Return the inputs of a specified form.
 * @param {HTMLFormElement} form Form element
 * @returns {HTMLElement[]} Form inputs
 */
const getFormInputs = form => {
	return Array.from( form.elements ).filter(
		// input.offsetParent filters out inputs of which the parent is hidden.
		input => ! [ 'hidden', 'submit' ].includes( input.type ) && input.offsetParent !== null
	);
};

/**
 * Get the fields of a form.
 * @param {HTMLFormElement} form Form element
 * @returns {object} Form fields (type: fields[])
 */
const getFormFields = form => {
	const groupedInputs = groupInputs( getFormInputs( form ) );
	const fields = {
		simple: groupedInputs.default,
		singleChoice: [],
		multipleChoice: [],
	};

	// Single Choice fields (i.e., fieldsets with radio buttons)
	const uniqueRadioNames = groupedInputs.radios.reduce(
		( acc, input ) => ( acc.includes( input.name ) ? acc : [ ...acc, input.name ] ),
		[]
	);

	for ( const name of uniqueRadioNames ) {
		// Get the first radio button of the group.
		const input = form.querySelector( `input[type="radio"][name="${ name }"]` );

		if ( input ) {
			const fieldset = input.closest( 'fieldset' );

			if ( fieldset ) {
				fields.singleChoice.push( fieldset );
			}
		}
	}

	// Multiple Choice fields (i.e., fieldsets with checkboxes)
	const uniqueCheckboxNames = groupedInputs.checkboxes.reduce(
		( acc, input ) => ( acc.includes( input.name ) ? acc : [ ...acc, input.name ] ),
		[]
	);

	for ( const name of uniqueCheckboxNames ) {
		// Get the first checkbox of the group.
		const input = form.querySelector( `input[type="checkbox"][name="${ name }"]` );

		if ( input ) {
			const fieldset = input.closest( 'fieldset' );

			if ( fieldset ) {
				fields.multipleChoice.push( fieldset );
			}
		}
	}

	return fields;
};

/**
 * Return the error element of a form.
 * @param {HTMLFormElement} form Form element
 * @returns {HTMLElement|undefined} Error element
 */
const getFormError = form => {
	return form.querySelector( '.contact-form__error' );
};

/**
 * Return the fields marked as invalid in a form.
 * @param {HTMLFormElement} form Form element
 * @returns {NodeListOf<HTMLElement>} Invalid elements
 */
const getInvalidFields = form => {
	return form.querySelectorAll( '[aria-invalid]' );
};

/******************************************************************************
 * BUILDERS
 ******************************************************************************/

/**
 * Create a new spinner.
 * @returns {HTMLSpanElement} Spinner
 */
const createSpinner = () => {
	const elt = document.createElement( 'span' );
	const spinner = document.createElement( 'span' );
	const srText = document.createElement( 'span' );

	// Hide SVG from screen readers
	spinner.setAttribute( 'aria-hidden', true );
	// Inlining the SVG rather than embedding it in an <img> tag allows us to set the `fill` property
	// in CSS.
	spinner.innerHTML =
		'<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></path></svg>';

	// Spinner replacement for screen readers
	srText.classList.add( 'visually-hidden' );
	srText.textContent = L10N.submittingForm || 'Submitting form';

	elt.classList.add( 'contact-form__spinner' );
	elt.appendChild( spinner );
	elt.appendChild( srText );

	return elt;
};

/**
 * Create a new warning icon.
 * @returns {HTMLSpanElement} Warning icon
 */
const createWarningIcon = () => {
	const elt = document.createElement( 'span' );

	elt.classList.add( 'contact-form__warning-icon' );
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
 * @param {string} errorId Error element ID
 * @returns {HTMLDivElement} Error container
 */
const createInputErrorContainer = errorId => {
	const elt = document.createElement( 'div' );

	elt.id = errorId;
	elt.classList.add( 'contact-form__input-error' );

	return elt;
};

/******************************************************************************
 * UTILS
 ******************************************************************************/

/**
 * Group radio inputs and checkbox inputs with multiple values.
 * Single inputs, checkbox groups and radio buttons handle validation and error
 * messages differently.
 * @param {HTMLElement[]} inputs Form inputs
 * @returns {object} Grouped inputs
 */
const groupInputs = inputs => {
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
 * CLEANUP
 ******************************************************************************/

/**
 * Clear all errors in a form.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const clearForm = ( form, opts ) => {
	clearErrors( form, opts );
};

/**
 * Remove the errors in a form.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const clearErrors = ( form, opts ) => {
	clearFormError( form );
	clearFieldErrors( form, opts );
};

/**
 * Empty the error element of a form.
 * @param {HTMLFormElement} form Form element
 */
const clearFormError = form => {
	const formError = getFormError( form );

	if ( formError ) {
		formError.replaceChildren();
	}
};

/**
 * Empty the error element of form fields and mark them as valid.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const clearFieldErrors = ( form, opts ) => {
	for ( const field of getInvalidFields( form ) ) {
		if ( isSingleChoiceField( field ) ) {
			clearGroupInputError( field );
		} else if ( isMultipleChoiceField( field ) ) {
			clearGroupInputError( field );
		} else {
			clearInputError( field, opts );
		}
	}
};

/**
 * Empty the error element of a field with multiple inputs (e.g., Multiple Choice or Single Choice
 * fields) and mark it as valid.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 */
const clearGroupInputError = fieldset => {
	fieldset.removeAttribute( 'aria-invalid' );
	fieldset.removeAttribute( 'aria-describedby' );

	const error = fieldset.querySelector( '.contact-form__input-error' );

	if ( error ) {
		error.replaceChildren();
	}
};

/**
 * Empty the error element a simple field (unique input) and mark it as valid.
 * @param {HTMLElement} input Input element
 * @param {object} opts Form options
 */
const clearInputError = ( input, opts ) => {
	input.removeAttribute( 'aria-invalid' );
	input.removeAttribute( 'aria-describedby' );

	const fieldWrap = input.closest(
		opts.hasInsetLabel ? '.contact-form__inset-label-wrap' : '.grunion-field-wrap'
	);

	if ( ! fieldWrap ) {
		return;
	}

	const error = fieldWrap.querySelector( '.contact-form__input-error' );

	if ( error ) {
		error.replaceChildren();
	}
};

/******************************************************************************
 * SUBMISSION
 ******************************************************************************/

/**
 * Submit a form and set its submitting state.
 * @param {HTMLFormElement} form Form element
 */
const submitForm = form => {
	showFormSubmittingIndicator( form );

	form.setAttribute( 'data-submitting', true );
	form.submit();
};

/**
 * Show a spinner in the submit button of a form.
 * @param {HTMLFormElement} form Form element
 */
const showFormSubmittingIndicator = form => {
	const submitBtn = getFormSubmitBtn( form );

	if ( submitBtn ) {
		// We should avoid using `disabled` when possible. One of the reasons is that `disabled`
		// buttons lose their focus, which can be confusing. Better use `aria-disabled` instead.
		// Ref. https://css-tricks.com/making-disabled-buttons-more-inclusive/#aa-aria-to-the-rescue
		submitBtn.setAttribute( 'aria-disabled', true );
		submitBtn.appendChild( createSpinner() );
	}
};

/******************************************************************************
 * INVALIDATION
 ******************************************************************************/

/**
 * Show errors in the form.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const invalidateForm = ( form, opts ) => {
	setErrors( form, opts );
};

/******************************************************************************
 * ERRORS
 ******************************************************************************/

/**
 * Set form errors.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const setErrors = ( form, opts ) => {
	setFormError( form );
	setFieldErrors( form, opts );
};

/**
 * Set the error element of a form.
 * @param {HTMLFormElement} form Form element
 */
const setFormError = form => {
	let error = getFormError( form );

	if ( ! error ) {
		error = createFormErrorContainer( form );

		const submitBtn = getFormSubmitBtn( form );

		if ( submitBtn ) {
			submitBtn.parentNode.insertBefore( error, submitBtn );
		} else {
			form.appendChild( error );
		}
	}

	error.appendChild(
		createError( L10N.invalidForm || 'Please make sure all fields are correct.' )
	);
};

/**
 * Set the error element of a form fields.
 * @param {HTMLFormElement} form Form element
 * @param {object} opts Form options
 */
const setFieldErrors = ( form, opts ) => {
	const { simple, singleChoice, multipleChoice } = getFormFields( form );

	for ( const field of simple ) {
		if ( ! isSimpleFieldValid( field ) ) {
			setSimpleFieldError( field, form, opts );
		}
	}

	for ( const field of singleChoice ) {
		if ( ! isSingleChoiceFieldValid( field ) ) {
			setSingleChoiceFieldError( field, form, opts );
		}
	}

	for ( const field of multipleChoice ) {
		if ( ! isMultipleChoiceFieldValid( field ) ) {
			setMultipleChoiceFieldError( field, form, opts );
		}
	}
};

/**
 * Set the error element of a simple field (single input) and mark it as invalid.
 * @param {HTMLElement} input Input element
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Form options
 */
const setSimpleFieldError = ( input, form, opts ) => {
	const errorId = `${ input.name }-error`;

	let error = form.querySelector( `#${ errorId }` );

	if ( ! error ) {
		error = createInputErrorContainer( errorId );

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
 * Set the error element of a Single Choice field.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Form options
 */
const setSingleChoiceFieldError = ( fieldset, form, opts ) => {
	setGroupInputError( fieldset, form, opts );
};

/**
 * Set the error element of a Multiple Choice field.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Form options
 */
const setMultipleChoiceFieldError = ( fieldset, form, opts ) => {
	setGroupInputError( fieldset, form, {
		...opts,
		message: L10N.checkboxMissingValue || 'Please select at least one option.',
	} );
};

/**
 * Set the error element of a group of inputs, i.e. a group of radio buttons or checkboxes.
 * These types of inputs are handled differently because the error message and invalidity
 * apply to the group as a whole, not to each individual input.
 * @param {HTMLFieldSetElement} fieldset Fieldset element
 * @param {HTMLFormElement} form Parent form element
 * @param {object} opts Options
 */
const setGroupInputError = ( fieldset, form, opts ) => {
	const firstInput = fieldset.querySelector( 'input' );

	if ( ! firstInput ) {
		return;
	}

	const inputName = firstInput.name.replace( '[]', '' );
	const errorId = `${ inputName }-error`;

	let error = form.querySelector( `#${ errorId }` );

	if ( ! error ) {
		error = createInputErrorContainer( errorId );
	}

	error.replaceChildren( createError( firstInput.validationMessage || opts.message || 'Error' ) );

	fieldset.appendChild( error );
	fieldset.setAttribute( 'aria-invalid', 'true' );
	fieldset.setAttribute( 'aria-describedby', errorId );
};
