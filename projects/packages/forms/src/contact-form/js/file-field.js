/* global jetpackFormFileField */

import JP_Dropzone from './jp-dropzone';

const JetpackFormFileUploader = ( function () {
	const uploader = {
		init( dropzone ) {
			const fileInput = dropzone.querySelector( '.jetpack-form-file-field' );
			const endpoint = fileInput?.getAttribute( 'data-upload-endpoint' );

			if ( ! endpoint ) {
				return;
			}

			const idField = dropzone.querySelector( '.jetpack-form-file-field__id' );
			const urlField = dropzone.querySelector( '.jetpack-form-file-field__url' );

			// Override the dropzone's handleNewFiles method
			const originalHandleNewFiles = dropzone.jp_dropzone.handleNewFiles.bind(
				dropzone.jp_dropzone
			);
			dropzone.jp_dropzone.handleNewFiles = async function ( files ) {
				for ( const file of Array.from( files ) ) {
					try {
						const response = await uploader.uploadFile( endpoint, file );
						if ( response?.id && response?.url ) {
							idField.value = response.id;
							urlField.value = response.url;
						}
					} catch ( error ) {
						// Trigger error event that can be caught by other parts of the application
						const errorEvent = new CustomEvent( 'jetpack-form-file-upload-error', {
							detail: {
								message:
									error.message ||
									jetpackFormFileField?.i18n?.uploadError ||
									'Error uploading file',
								error: error,
							},
						} );
						dropzone.dispatchEvent( errorEvent );
						return;
					}
				}
				// Only show preview if upload was successful
				originalHandleNewFiles( files );
			};

			// Handle upload errors
			dropzone.addEventListener( 'jetpack-form-file-upload-error', function ( event ) {
				if ( window.wp?.data?.dispatch( 'core/notices' ) ) {
					// Use WordPress notice system if available
					window.wp.data.dispatch( 'core/notices' ).createNotice( 'error', event.detail.message, {
						type: 'snackbar',
						isDismissible: true,
					} );
				} else {
					// Fallback to simple error display
					const errorDiv = document.createElement( 'div' );
					errorDiv.className = 'jetpack-form-file-field__error notice notice-error';
					errorDiv.textContent = event.detail.message;
					dropzone.appendChild( errorDiv );
					setTimeout( () => errorDiv.remove(), 5000 );
				}
			} );
		},

		async uploadFile( endpoint, file ) {
			const formData = new FormData();
			// Ensure the file is named correctly for WordPress REST API
			formData.append( 'file', file, file.name );

			// Debug: Log the FormData entries and file details
			console.log( 'File details:', {
				name: file.name,
				size: file.size,
				type: file.type,
				lastModified: file.lastModified,
			} );

			console.log( 'FormData contents:' );
			for ( const pair of formData.entries() ) {
				console.log(
					`- ${ pair[ 0 ] }: ${ pair[ 1 ] } (type: ${ typeof pair[ 1 ] }, instanceof File: ${
						pair[ 1 ] instanceof File
					})`
				);
			}

			// Add nonce if available
			if ( jetpackFormFileField?.nonce ) {
				formData.append( '_wpnonce', jetpackFormFileField.nonce );
			}

			// Log final FormData after nonce
			console.log( 'Final FormData contents:' );
			for ( const pair of formData.entries() ) {
				console.log(
					`- ${ pair[ 0 ] }: ${ pair[ 1 ] } (type: ${ typeof pair[ 1 ] }, instanceof File: ${
						pair[ 1 ] instanceof File
					})`
				);
			}

			try {
				const response = await fetch( endpoint, {
					method: 'POST',
					credentials: 'same-origin', // Send cookies
					body: formData,
				} );

				// Debug: Log raw response headers
				console.log( 'Response Headers:', {
					contentType: response.headers.get( 'content-type' ),
					...Object.fromEntries( [ ...response.headers.entries() ] ),
				} );

				const data = await response.json();

				// Debug: Log complete response data
				console.log( 'Response Data:', {
					ok: response.ok,
					status: response.status,
					statusText: response.statusText,
					data,
					url: response.url,
				} );

				if ( ! response.ok ) {
					throw new Error( data?.message || 'Upload failed' );
				}

				return data;
			} catch ( error ) {
				console.error( 'Upload Error:', {
					name: error.name,
					message: error.message,
					stack: error.stack,
				} );
				throw error;
			}
		},
	};

	return {
		init: uploader.init,
	};
} )();

document.addEventListener( 'DOMContentLoaded', () => {
	const forms = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );
	forms.forEach( dropzone => {
		// Initialize dropzone
		dropzone.jp_dropzone = new JP_Dropzone( dropzone, {
			i18n: jetpackFormFileField?.i18n,
		} );
		// Initialize uploader
		JetpackFormFileUploader.init( dropzone );
	} );
} );
