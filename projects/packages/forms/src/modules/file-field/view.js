/**
 * WordPress dependencies
 */
import { store, getContext, withScope, getElement, getConfig } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/field-file';
/**
 * Format the file size to a human-readable string.
 *
 * @param {number} size         - The size of the file in bytes.
 * @param {number} [decimals=2] - The number of decimals to include.
 *
 * @return {string} The formatted file size.
 */
const formatBytes = ( size, decimals = 2 ) => {
	const config = getConfig( NAMESPACE );
	if ( size === 0 ) return config.i18n.zeroBytes;
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = config.i18n.fileSizeUnits || [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
	const i = Math.floor( Math.log( size ) / Math.log( k ) );
	const formattedSize = parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) );
	const numberFormat = new Intl.NumberFormat( config.i18n.locale, {
		minimumFractionDigits: dm,
		maximumFractionDigits: dm,
	} );
	return `${ numberFormat.format( formattedSize ) } ${ sizes[ i ] }`;
};

/**
 * Add the file to the context.
 *
 * @param {File} file - The file to add.
 */
const addFileToContext = file => {
	const reader = new FileReader();
	reader.readAsDataURL( file );
	reader.onload = withScope( () => {
		const context = getContext();
		const config = getConfig( NAMESPACE );
		const fileId = performance.now() + '-' + Math.random();

		let error = null;
		if ( file.size > config.maxUploadSize ) {
			error = config.i18n.fileTooLarge;
		}
		context.files.push( {
			name: file.name,
			url: 'url(' + reader.result + ')',
			formattedSize: formatBytes( file.size, 2 ),
			hasToken: false,
			id: fileId,
			error,
		} );
		context.hasFiles = true;
		! error && uploadFile( file, fileId );
	} );
};

/**
 * Make the endpoint request.
 *
 * @param {File}   file   - The file to upload.
 * @param {string} fileId - The file ID.
 */
const uploadFile = ( file, fileId ) => {
	const { endpoint, uploadToken } = getConfig( NAMESPACE );
	const xhr = new XMLHttpRequest();
	const formData = new FormData();

	xhr.open( 'POST', endpoint, true );
	xhr.upload.addEventListener( 'progress', withScope( onProgress.bind( this, fileId ) ) );
	xhr.addEventListener( 'readystatechange', withScope( onReadyStateChange.bind( this, fileId ) ) );

	formData.append( 'file', file );
	formData.append( 'upload_token', uploadToken );
	xhr.send( formData );
};

/**
 * Responsible for updating the progress circle.
 * Gets called on the progress upload.
 *
 * @param {string}        fileId - The file ID.
 * @param {ProgressEvent} event  - The progress event object.
 */
const onProgress = ( fileId, event ) => {
	const progress = ( event.loaded / event.total ) * 100;
	// We don't want to show 100% progress, as it's misleading.
	updateFileContext( { progress: Math.min( progress, 97 ) }, fileId );
};

/**
 * React to the onReadyStateChange event when the endpoint returns.
 *
 * @param {string} fileId - The file ID.
 * @param {Event}  event  - The event object.
 */
const onReadyStateChange = ( fileId, event ) => {
	const xhr = event.target;
	if ( xhr.readyState === 4 ) {
		if ( xhr.status === 200 ) {
			const response = JSON.parse( xhr.responseText );
			if ( response.success ) {
				updateFileContext( { token: response.data.token, hasToken: true }, fileId );
				return;
			}
		}
		if ( xhr.responseText ) {
			const response = JSON.parse( xhr.responseText );
			// eslint-disable-next-line no-console
			console.error( 'Error uploading file', response );
		}
	}
};

/**
 * Update the context with the new updatedFile object based on the file ID.
 *
 * @param {object} updatedFile - The updated file object.
 * @param {string} fileId      - The file ID.
 */
const updateFileContext = ( updatedFile, fileId ) => {
	const context = getContext();
	const index = context.files.findIndex( file => file.id === fileId );
	context.files[ index ] = Object.assign( context.files[ index ], updatedFile );
};

/**
 * Remove file from the temporary folder.
 *
 * @param {string} fileId - The file ID to remove.
 */
const removeFile = fileId => {
	const { endpoint, uploadToken } = getConfig( NAMESPACE );
	const formData = new FormData();
	formData.append( 'file_id', fileId );
	formData.append( 'upload_token', uploadToken );

	fetch( `${ endpoint }/remove`, {
		method: 'POST',
		body: formData,
	} ).then( response => response.json() );
};

store( NAMESPACE, {
	actions: {
		/**
		 * Open the file picker dialog.
		 */
		openFilePicker() {
			const { ref } = getElement();
			const fileInput = ref.parentNode.querySelector( '.jetpack-form-file-field' );
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
			files.forEach( addFileToContext );
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
					addFileToContext( item.getAsFile() );
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
			context.files = context.files.filter( fileObject => fileObject.id !== fileId );
			context.hasFiles = context.files.length > 0;

			removeFile( fileId );
		},
	},

	callbacks: {},
} );
