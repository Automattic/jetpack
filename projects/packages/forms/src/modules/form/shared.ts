/*
 * External dependencies
 */
import { getConfig } from '@wordpress/interactivity';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-forms:interactivity' );

const NAMESPACE = 'jetpack/form';
const config = getConfig( NAMESPACE );

const getForm = ( formHash: string ) => {
	return document.getElementById( 'jp-form-' + formHash ) as HTMLFormElement | null;
};

export const focusNextInput = ( formHash: string ) => {
	const form = getForm( formHash );

	if ( ! form ) {
		return;
	}

	const currentStep = form.querySelector( '.is-current-step' );
	const focusableElements = currentStep.querySelectorAll(
		'input, select, textarea, .jetpack-form-file-field__dropzone-inner, [tabindex]:not([disabled])'
	) as NodeListOf< HTMLElement >;
	focusableElements[ 0 ]?.focus();
};

export const dispatchSubmitEvent = ( formHash: string ) => {
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

export const submitForm = async ( formHash: string ) => {
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

		const result = await response.json();

		if ( ! response.ok ) {
			debug( `Form submission failed: ${ result?.data?.code }`, response );
			// If we have a specific error from the server, use it; otherwise fall back to network error
			return result && result.data && result.data.error
				? { success: false, error: result.data.error }
				: { success: false, error: config?.error_types?.network_error };
		}

		return result;
	} catch ( error ) {
		debug( 'Form submission failed', error );
		return { success: false, error: config?.error_types?.network_error };
	}
};
