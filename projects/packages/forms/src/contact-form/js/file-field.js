import JP_Dropzone from './jp-dropzone';

document.addEventListener( 'DOMContentLoaded', () => {
	const forms = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );
	forms.forEach( dropzone => {
		new JP_Dropzone( dropzone, { i18n: window?.jetpackFormFileField.i18n } );
	} );
} );
