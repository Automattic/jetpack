/* global jetpackFormFileField */

import Dropzone from '../libs/dropzone';
import { setSimpleFieldError, clearInputError } from './form-errors';

document.addEventListener( 'DOMContentLoaded', () => {
	const inputDropZones = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );

	inputDropZones.forEach( dropzone => {
		// Initialize dropzone
		dropzone.jp_dropzone = new Dropzone( dropzone, {
			maxUploadSize: jetpackFormFileField?.maxUploadSize,
			i18n: jetpackFormFileField?.i18n,
			endpoint: jetpackFormFileField?.uploadEndpoint,
			wp_nonce: jetpackFormFileField?.wp_nonce,
			jp_nonce: jetpackFormFileField?.jp_nonce,
		} )
			.on( 'error', args => {
				setSimpleFieldError( args.input, args.form, {} );
			} )
			.on( 'error:clear', args => {
				clearInputError( args.input, {} );
			} );
	} );
} );
