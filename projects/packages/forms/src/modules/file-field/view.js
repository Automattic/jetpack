/**
 * WordPress dependencies
 */
import { store, getContext, withScope, getElement, getConfig } from '@wordpress/interactivity';
import { clearInputError } from '../../contact-form/js/form-errors.js';

const NAMESPACE = 'jetpack/field-file';

let uploadToken = null;
let tokenExpiry = null;

/**
 * Retuns the upload token. Sometimes it has to fetch a new one if it expired. Or we haven't needed one just yet.
 *
 * @return {string} The upload token.
 */
const getUploadToken = async () => {
	// Check if the token exists and is not expired
	if ( uploadToken && tokenExpiry && Date.now() < tokenExpiry ) {
		return uploadToken;
	}

	const { token, expiresAt } = await fetchUploadToken();
	uploadToken = token;
	tokenExpiry = expiresAt * 1000; // Convert expiry timestamp to milliseconds
	return uploadToken;
};
/**
 * Fetches the upload token from the server.
 *
 * @return {{ token: string, expiresAt: number }} The upload token and its expiration time.
 */
const fetchUploadToken = async () => {
	const { endpoint } = getConfig( NAMESPACE );

	const tokenError = {
		token: null, // Assuming the token is in the `token` field
		expiresAt: 0,
	};
	try {
		const response = await fetch( `${ endpoint }/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( { context: 'file-upload' } ),
		} );

		if ( ! response.ok ) {
			return tokenError;
		}

		const data = await response.json();
		return {
			token: data.token, // Assuming the token is in the `token` field
			expiresAt: data.expiration,
		};
	} catch ( error ) {
		if ( error ) {
			return tokenError;
		}
	}
	return tokenError;
};

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

	const { ref } = getElement();
	clearInputError( ref, { hasInsetLabel: state.isInlineForm } );

	const config = getConfig( NAMESPACE );
	const context = getContext();

	let error = null;

	// Check that the file not more then the max size.
	if ( file.size > config.maxUploadSize ) {
		error = config.i18n.fileTooLarge;
	}

	// Check that the file type is allowed.
	if ( ! context.allowedMimeTypes.includes( file.type ) ) {
		error = config.i18n.invalidType;
	}

	// Get all files that don't have an error properly
	const validFiles = context.files.filter( fileInfo => ! fileInfo.error );

	// Check if the user is trying to add more files then allowed.
	if ( context.maxFiles < validFiles.length + 1 ) {
		error = config.i18n.maxFiles;
	}

	const clientFileId = performance.now() + '-' + Math.random();

	context.files.push( {
		name: file.name,
		formattedSize: formatBytes( file.size, 2 ),
		isUploaded: false,
		hasError: !! error,
		id: clientFileId,
		error,
	} );

	// Start the upload if we don't have any errors.
	! error && actions.uploadFile( file, clientFileId );

	// Load the file so we can display it. In case it is an image.
	reader.onload = withScope( () => {
		updateFileContext( { url: 'url(' + reader.result + ')' }, clientFileId );
	} );
};

// Map to store AbortControllers for each file upload
const uploadControllers = new Map();

/**
 * Responsible for updating the progress circle.
 * Gets called on the progress upload.
 *
 * @param {string}        clientFileId - The client file ID.
 * @param {ProgressEvent} event        - The progress event object.
 */
const onProgress = ( clientFileId, event ) => {
	const progress = ( event.loaded / event.total ) * 100;
	// We don't want to show 100% progress, as it's misleading.
	updateFileContext( { progress: Math.min( progress, 97 ) }, clientFileId );
};

/**
 * React to the onReadyStateChange event when the endpoint returns.
 *
 * @param {string} clientFileId - The file ID.
 * @param {Event}  event        - The event object.
 */
const onReadyStateChange = ( clientFileId, event ) => {
	const xhr = event.target;
	if ( xhr.readyState === 4 ) {
		if ( xhr.status === 200 ) {
			const response = JSON.parse( xhr.responseText );
			if ( response.success ) {
				updateFileContext(
					{
						file_id: response.data.file_id,
						isUploaded: true,
						name: response.data.name,
						type: response.data.type,
						size: response.data.size,
						fileJson: JSON.stringify( {
							file_id: response.data.file_id,
							name: response.data.name,
							size: response.data.size,
							type: response.data.type,
						} ),
					},
					clientFileId
				);
				return;
			}
		} else {
			const config = getConfig( NAMESPACE );
			updateFileContext( { error: config.i18n.uploadFailed, hasError: true }, clientFileId );
			return;
		}
		if ( xhr.responseText ) {
			const response = JSON.parse( xhr.responseText );
			updateFileContext( { error: response.message, hasError: true }, clientFileId );
		}
	}
};

/**
 * Update the context with the new updatedFile object based on the file ID.
 *
 * @param {object} updatedFile  - The updated file object.
 * @param {string} clientFileId - The client file ID.
 */
const updateFileContext = ( updatedFile, clientFileId ) => {
	const context = getContext();
	const index = context.files.findIndex( file => file.id === clientFileId );
	context.files[ index ] = Object.assign( context.files[ index ], updatedFile );
};

const { state, actions } = store( NAMESPACE, {
	state: {
		get isInlineForm() {
			const { ref } = getElement();
			const form = ref.closest( '.wp-block-jetpack-contact-form' );
			return (
				( form && form.classList.contains( 'is-style-outlined' ) ) ||
				form.classList.contains( 'is-style-animated' )
			);
		},
		get hasFiles() {
			return !! getContext().files.length > 0;
		},

		get hasMaxFiles() {
			const context = getContext();
			return context.maxFiles <= context.files.length;
		},
	},

	actions: {
		/**
		 * Open the file picker dialog.
		 */
		openFilePicker() {
			const { ref } = getElement();
			const fileInput = ref.parentNode.querySelector( '.jetpack-form-file-field' );

			if ( fileInput ) {
				fileInput.value = ''; // Reset the field so that we always get the onchange event.
				fileInput.click();
			}
		},

		/**
		 * Handle file added event.
		 *
		 * @param {Event} event - The event object.
		 */
		fileAdded( event ) {
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
		 * Make the endpoint request.
		 * This function is a generator so that we can use the withScope function.
		 * And the context gets passed to the onProgress and onReadyStateChange functions.
		 *
		 * @param {File}   file         - The file to upload.
		 * @param {string} clientFileId - The client file ID.
		 * @yield {Promise<string>} The upload token.
		 */
		uploadFile: function* ( file, clientFileId ) {
			const { endpoint, i18n } = getConfig( NAMESPACE );

			const token = yield getUploadToken();

			if ( ! token ) {
				updateFileContext( { error: i18n.uploadFailed, hasError: true }, clientFileId );
				return;
			}

			const xhr = new XMLHttpRequest();
			const formData = new FormData();

			// Create an AbortController for this upload
			const abortController = new AbortController();
			uploadControllers.set( clientFileId, abortController );

			xhr.open( 'POST', endpoint, true );
			xhr.upload.addEventListener( 'progress', withScope( onProgress.bind( this, clientFileId ) ) );
			xhr.addEventListener(
				'readystatechange',
				withScope( onReadyStateChange.bind( this, clientFileId ) )
			);

			// Handle abort signal
			abortController.signal.addEventListener( 'abort', () => {
				xhr.abort();
			} );

			formData.append( 'file', file );
			formData.append( 'token', token );
			xhr.send( formData );
		},

		/**
		 * Remove a file from the context and cancel its upload if in progress.
		 *
		 * @param {Event} event - The event object.
		 * @yield {Promise<string>} The upload token.
		 */
		removeFile: function* ( event ) {
			event.preventDefault();

			const { ref } = getElement();
			const field = ref.closest( '.jetpack-form-file-field__container' ); // Needed to select the top most field.
			clearInputError( field, { hasInsetLabel: state.isInlineForm } );

			const context = getContext();
			const clientFileId = event.target.dataset.id;

			// Cancel the upload if it's in progress
			if ( uploadControllers.has( clientFileId ) ) {
				const abortController = uploadControllers.get( clientFileId );
				abortController.abort(); // Cancel the upload
				uploadControllers.delete( clientFileId ); // Clean up the controller
			}

			const file = context.files.find( fileObject => fileObject.id === clientFileId );

			if ( file && file.file_id ) {
				const { endpoint } = getConfig( NAMESPACE );
				const token = yield getUploadToken();
				if ( token ) {
					const formData = new FormData();
					formData.append( 'token', token );
					formData.append( 'file_id', file.file_id );
					fetch( `${ endpoint }/remove`, {
						method: 'POST',
						body: formData,
					} );
				}
			}
			// Remove the file from the context
			context.files = context.files.filter( fileObject => fileObject.id !== clientFileId );
		},
	},

	callbacks: {},
} );
