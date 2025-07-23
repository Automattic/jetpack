/*
 * External dependencies
 */
import { getConfig } from '@wordpress/interactivity';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-forms:interactivity' );

const NAMESPACE = 'jetpack/form';
const config = getConfig( NAMESPACE );

const getForm = formHash => {
	return document.getElementById( 'jp-form-' + formHash );
};

export const focusNextInput = formHash => {
	const form = getForm( formHash );

	if ( ! form ) {
		return;
	}

	const currentStep = form.querySelector( '.is-current-step' );
	const focusableElements = currentStep.querySelectorAll(
		'input, select, textarea, .jetpack-form-file-field__dropzone-inner, [tabindex]:not([disabled])'
	);
	focusableElements[ 0 ]?.focus();
};

export const dispatchSubmitEvent = formHash => {
	const form = getForm( formHash );

	if ( ! form ) {
		return;
	}

	form.dispatchEvent(
		new Event( 'submit', {
			bubbles: true,
			cancelable: true,
		} )
	);
};

export const submitForm = async formHash => {
	const form = getForm( formHash );

	if ( ! form ) {
		return { success: false, error: 'Form not found' };
	}

	try {
		const formData = new FormData( form );

		const adminAjaxUrl = config?.admin_ajax_url || '/wp-admin/admin-ajax.php';
		const url = `${ adminAjaxUrl }?action=grunion-contact-form`;

		const response = await fetch( url, {
			method: 'POST',
			body: formData,
			headers: {
				Accept: 'application/json',
			},
		} );

		if ( ! response.ok ) {
			debug( 'Form submission failed', response );
			return { success: false, error: config?.error_types?.network_error };
		}

		const result = await response.json();

		return result;
	} catch ( error ) {
		debug( 'Form submission failed', error );
		return { success: false, error: config?.error_types?.network_error };
	}
};
