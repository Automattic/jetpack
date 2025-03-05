/**
 * WordPress dependencies
 */
import { store, getContext, withScope, getElement } from '@wordpress/interactivity';

/**
 * Format the file size to a human-readable string.
 *
 * @param {number} size             - The size of the file in bytes.
 * @param {number} [decimals=2]     - The number of decimals to include.
 * @param {string} [locale='en-US'] - The locale to use for formatting.
 * @return {string} The formatted file size.
 */
const formatBytes = ( size, decimals = 2, locale = 'en-US' ) => {
	if ( size === 0 ) return '0 bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = state.i18n.fileSizeUnits || [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
	const i = Math.floor( Math.log( size ) / Math.log( k ) );
	const formattedSize = parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) );
	const numberFormat = new Intl.NumberFormat( locale, {
		minimumFractionDigits: dm,
		maximumFractionDigits: dm,
	} );
	return `${ numberFormat.format( formattedSize ) } ${ sizes[ i ] }`;
};

const { state, callbacks } = store( 'jpDropZone', {
	state: {},
	actions: {
		/**
		 * Open the file picker dialog.
		 *
		 * @param {Event} event - The event object.
		 */
		openFilePicker: event => {
			const fileInput = event.target.parentNode.querySelector( '.jetpack-form-file-field' );
			if ( fileInput ) {
				fileInput.click();
			}
		},

		/**
		 * Handle file added event.
		 *
		 * @param {Event} event - The event object.
		 */
		fileAdded: event => {
			const files = Array.from( event.target.files );
			files.forEach( callbacks.addFileToContext );
		},

		/**
		 * Handle file dropped event.
		 *
		 * @param {DragEvent} event - The drag event object.
		 */
		fileDropped: event => {
			event.preventDefault();
			if ( event.dataTransfer ) {
				for ( const item of Array.from( event.dataTransfer.items ) ) {
					if ( item.webkitGetAsEntry()?.isDirectory ) {
						return;
					}
					callbacks.addFileToContext( item.getAsFile() );
				}
			}
			const context = getContext();
			context.isDropping = false;
		},

		/**
		 * Handle drag over event.
		 *
		 * @param {DragEvent} event - The drag event object.
		 */
		dragOver: event => {
			const context = getContext();
			context.isDropping = true;
			event.preventDefault();
		},

		/**
		 * Handle drag leave event.
		 */
		dragLeave: () => {
			const context = getContext();
			context.isDropping = false;
		},

		/**
		 * Remove a file from the context.
		 *
		 * @param {Event} event - The event object.
		 */
		removeFile: event => {
			const context = getContext();
			const fileId = event.target.dataset.id;
			context.files = context.files.filter( file => file.id !== fileId );
			context.hasFiles = context.files.length > 0;
		},
	},

	callbacks: {
		/**
		 * Add the file to the context.
		 *
		 * @param {File} file - The file to add.
		 */
		addFileToContext: file => {
			const reader = new FileReader();
			reader.readAsDataURL( file );
			reader.onload = withScope( () => {
				const context = getContext();
				const fileId = performance.now() + '-' + Math.random();
				context.files.push( {
					name: file.name,
					url: 'url(' + reader.result + ')',
					formattedSize: formatBytes( file.size, 2, state.i18n.locale ),
					hasToken: false,
					id: fileId,
				} );
				context.hasFiles = true;
				callbacks.uploadFile( file, fileId );
			} );
		},

		/**
		 * Make the endpoint request.
		 *
		 * @param {File}   file   - The file to upload.
		 * @param {string} fileId - The file ID.
		 */
		uploadFile: ( file, fileId ) => {
			const url = state.endpoint;
			const xhr = new XMLHttpRequest();
			const formData = new FormData();
			xhr.open( 'POST', url, true );
			xhr.withCredentials = true;
			xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
			xhr.setRequestHeader( 'X-WP-Nonce', state.wp_nonce );
			xhr.setRequestHeader( 'X-Jetpack-Upload-Nonce', state.jp_nonce );
			xhr.upload.addEventListener(
				'progress',
				withScope( callbacks.onProgress.bind( this, fileId ) )
			);
			xhr.addEventListener(
				'readystatechange',
				withScope( callbacks.onReadyStateChange.bind( this, fileId ) )
			);
			formData.append( 'context', 'jetpack-form' );
			formData.append( 'file', file );
			xhr.send( formData );
		},

		/**
		 * Responsible for updating the progress circle.
		 * Gets called on the progress upload.
		 *
		 * @param {string}        fileId - The file ID.
		 * @param {ProgressEvent} event  - The progress event object.
		 */
		onProgress: ( fileId, event ) => {
			const { ref } = getElement();
			const previewProgressElement = ref.querySelector( '[data-progress-id="' + fileId + '"]' );
			const progress = ( event.loaded / event.total ) * 100;
			if ( previewProgressElement ) {
				previewProgressElement.style.setProperty( '--progress', progress );
			}
			callbacks.updateFileContext( { progress }, fileId );
		},

		/**
		 * React to the onReadyStateChange event when the endpoint returns.
		 *
		 * @param {string} fileId - The file ID.
		 * @param {Event}  event  - The event object.
		 */
		onReadyStateChange: ( fileId, event ) => {
			const xhr = event.target;
			if ( xhr.readyState === 4 ) {
				if ( xhr.status === 200 ) {
					const response = JSON.parse( xhr.responseText );
					if ( response.success ) {
						callbacks.updateFileContext( { token: response.data.token, hasToken: true }, fileId );
					}
				}
				// if ( xhr.responseText ) {
				// 	const response = JSON.parse( xhr.responseText );
				// 	// console.error( 'Error uploading file', response );
				// }
			}
		},

		/**
		 * Update the context with the new updatedFile object based on the file ID.
		 *
		 * @param {object} updatedFile - The updated file object.
		 * @param {string} fileId      - The file ID.
		 */
		updateFileContext: ( updatedFile, fileId ) => {
			const context = getContext();
			const index = context.files.findIndex( file => file.id === fileId );
			context.files[ index ] = Object.assign( context.files[ index ], updatedFile );
		},
	},
} );
