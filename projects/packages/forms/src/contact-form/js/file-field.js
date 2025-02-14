/* global jetpackFormFileField */

import JP_Dropzone from './jp-dropzone';

document.addEventListener( 'DOMContentLoaded', () => {
	const forms = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );
	forms.forEach( dropzone => {
		// Initialize dropzone
		dropzone.jp_dropzone = new JP_Dropzone( dropzone, {
			i18n: jetpackFormFileField?.i18n,
			endpoint: jetpackFormFileField?.uploadEndpoint,
			nonce: jetpackFormFileField?.nonce,
		} );
	} );
} );
