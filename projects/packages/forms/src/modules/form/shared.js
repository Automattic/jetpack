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

export const submitForm = formHash => {
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
