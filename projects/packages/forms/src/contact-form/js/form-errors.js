const { __ } = wp.i18n;
const L10N = {
	/* translators: text read by a screen reader when a warning icon is displayed in front of an error message. */
	warning: __( 'Warning.', 'jetpack-forms' ),
};

/**
 * Set the error element of a simple field (single input) and mark it as invalid.
 * @param {HTMLElement}     input Input element
 * @param {HTMLFormElement} form  Parent form element
 * @param {object}          opts  Form options
 */
export const setSimpleFieldError = ( input, form, opts, message = null ) => {
	const name = input.name ? input.name : input.getAttribute( 'name' );
	const errorId = `${ name }-error`;

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

	if ( ! message ) {
		message = input.validationMessage;
	}

	error.replaceChildren( createError( message ) );
	input.setAttribute( 'aria-invalid', 'true' );
	input.setAttribute( 'aria-describedby', errorId );
};

/**
 * Empty the error element a simple field (unique input) and mark it as valid.
 * @param {HTMLElement} input Input element
 * @param {object}      opts  Form options
 */
export const clearInputError = ( input, opts ) => {
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
		error.remove();
	}

	const form = input.closest( 'form' );
	const inputErrors = form.querySelectorAll( '.contact-form__input-error' );
	const mainErrorDiv = form.querySelector( '.contact-form__error' );
	if ( mainErrorDiv && inputErrors.length === 0 ) {
		mainErrorDiv.remove();
	}
};

/**
 * Create a new error container for a form input.
 * @param {string} errorId Error element ID
 * @returns {HTMLDivElement} Error container
 */
export const createInputErrorContainer = errorId => {
	const elt = document.createElement( 'div' );

	elt.id = errorId;
	elt.classList.add( 'contact-form__input-error' );

	return elt;
};

/**
 * Create a new error fragment.
 * @param {string} str Error message
 * @returns {DocumentFragment} Error fragment
 */
export const createError = str => {
	const fragment = document.createDocumentFragment();

	fragment.appendChild( createWarningIcon() );
	fragment.appendChild( createErrorText( str ) );

	return fragment;
};

/**
 * Create a new warning icon.
 * @returns {HTMLSpanElement} Warning icon
 */
const createWarningIcon = () => {
	const elt = document.createElement( 'span' );
	const srOnly = document.createElement( 'span' );
	const icon = document.createElement( 'i' );

	srOnly.textContent = L10N.warning;
	srOnly.classList.add( 'visually-hidden' );

	icon.setAttribute( 'aria-hidden', true );

	elt.classList.add( 'contact-form__warning-icon' );
	elt.appendChild( srOnly );
	elt.appendChild( icon );

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
