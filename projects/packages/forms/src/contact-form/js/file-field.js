/* global jetpackFormFileField */
import { setSimpleFieldError, clearInputError } from './form-errors';
import JP_Dropzone from './jp-dropzone';

document.addEventListener( 'DOMContentLoaded', () => {
	const inputDropZones = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );

	inputDropZones.forEach( dropzone => {
		// Initialize dropzone
		dropzone.jp_dropzone = new JP_Dropzone( dropzone, {
			i18n: jetpackFormFileField?.i18n,
			endpoint: jetpackFormFileField?.uploadEndpoint,
			nonce: jetpackFormFileField?.nonce,
		} )
			.on( 'error', args => {
				setSimpleFieldError( args.input, args.form, {} );
			} )
			.on( 'clear-error', args => {
				clearInputError( args.input, {} );
			} );
	} );
} );
