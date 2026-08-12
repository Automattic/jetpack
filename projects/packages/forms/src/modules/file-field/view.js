/**
 * WordPress dependencies
 */
import { store, getContext, withScope, getElement, getConfig } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { isEmptyValue } from '../../contact-form/js/validate-helper.js';

// The file field lives in the shared form store, like every other field module. It keeps its own
// namespace only for `wp_interactivity_config()` — the upload endpoint, icon path and per-file
// error strings — which is the same split `jetpack/field-phone` uses.
const NAMESPACE = 'jetpack/form';
const CONFIG_NAMESPACE = 'jetpack/field-file';

const ENTER = 13;
const SPACE = 32;

let uploadToken = null;
let tokenExpiry = null;
// Set while a token request is in flight so several files added at once share a single request
// instead of each firing its own.
let pendingTokenRequest = null;

/**
 * Returns the upload token, fetching a new one if it expired or was never fetched.
 *
 * The token authorizes uploads for the whole site rather than for one field, so it is cached at
 * module scope and shared by every file field on the page.
 *
 * @return {Promise<string|null>} The upload token, or null if one could not be obtained.
 */
const getUploadToken = async () => {
	// Check if the token exists and is not expired
	if ( uploadToken && tokenExpiry && Date.now() < tokenExpiry ) {
		return uploadToken;
	}

	if ( ! pendingTokenRequest ) {
		pendingTokenRequest = fetchUploadToken().finally( () => {
			pendingTokenRequest = null;
		} );
	}

	const { token, expiresAt } = await pendingTokenRequest;
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
	const { endpoint } = getConfig( CONFIG_NAMESPACE );

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
	const config = getConfig( CONFIG_NAMESPACE );
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

const getFileIcon = file => {
	const config = getConfig( CONFIG_NAMESPACE );
	const fileType = file.type.split( '/' )[ 0 ];
	const fileExtension = file.name.split( '.' ).pop().toLowerCase();

	const iconMap = {
		image: 'png',
		video: 'mp4',
		audio: 'mp3',
		document: 'pdf',
		application: 'txt',
	};

	const extensionMap = {
		pdf: 'pdf',
		doc: 'doc',
		docx: 'doc',
		txt: 'txt',
		ppt: 'ppt',
		pptx: 'ppt',
		xls: 'xls',
		xlsx: 'xls',
		csv: 'xls',
		zip: 'zip',
		sql: 'sql',
		cal: 'cal',
	};
	const iconName = extensionMap[ fileExtension ] || iconMap[ fileType ] || 'txt';
	return 'url(' + config.iconsPath + iconName + '.svg)';
};

/**
 * Reads the file field's configuration from the standard `fieldExtra` context entry, the same
 * place the date field finds its format and the number field its min/max.
 *
 * @return {{ maxFiles: number, allowedMimeTypes: string[] }} The field's configuration.
 */
const getFileFieldExtra = () => {
	const { maxFiles, allowedMimeTypes } = getContext().fieldExtra || {};
	return {
		maxFiles: maxFiles ?? 1,
		allowedMimeTypes: allowedMimeTypes ?? [],
	};
};

/**
 * The files currently held by the field, or an empty list outside a file field's scope.
 *
 * @return {Array} The field's files.
 */
const getFileFieldFiles = () => getContext().files ?? [];

/**
 * Add the file to the context.
 *
 * @param {File} file - The file to add.
 */
const addFileToContext = file => {
	const config = getConfig( CONFIG_NAMESPACE );
	const context = getContext();
	const { maxFiles, allowedMimeTypes } = getFileFieldExtra();

	let error = null;

	// Check that the file not more then the max size.
	if ( file.size > config.maxUploadSize ) {
		error = config.i18n.fileTooLarge;
	}

	// Check that the file type is allowed.
	if ( ! allowedMimeTypes.includes( file.type ) ) {
		error = config.i18n.invalidType;
	}

	// Get all files that don't have an error properly
	const validFiles = context.files.filter( fileInfo => ! fileInfo.error );

	// Check if the user is trying to add more files then allowed.
	if ( maxFiles < validFiles.length + 1 ) {
		error = config.i18n.maxFiles;
	}

	const clientFileId = performance.now() + '-' + Math.random();
	const hasImage =
		[ 'image/gif', 'image/jpg', 'image/png', 'image/jpeg' ].includes( file.type ) &&
		URL.createObjectURL;
	const fileUrl = hasImage ? 'url(' + URL.createObjectURL( file ) + ')' : getFileIcon( file );
	context.files.push( {
		name: file.name,
		formattedSize: formatBytes( file.size, 2 ),
		hasIcon: ! hasImage,
		isUploaded: false,
		hasError: !! error,
		id: clientFileId,
		url: hasImage ? fileUrl : null,
		mask: ! hasImage ? fileUrl : null,
		error,
	} );

	actions.updateField( context.fieldId, context.files );

	// Start the upload if we don't have any errors.
	! error && actions.uploadFile( file, clientFileId );

	// Load the file so we can display it. In case it is an image.
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
		// The request has settled either way, so its controller can never abort anything again.
		// Dropping it here keeps the map from growing for the lifetime of the page.
		uploadControllers.delete( clientFileId );

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
			const config = getConfig( CONFIG_NAMESPACE );
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

	actions.updateField( context.fieldId, context.files );
};

const { actions } = store( NAMESPACE, {
	state: {
		validators: {
			/**
			 * Validates the file field's value: the array of files held in context.
			 *
			 * Mirrors `validators.phone` — a registered validator owns its own empty/required
			 * handling rather than leaning on the shared `validateField()` helper.
			 *
			 * @param {Array}   value      - The field's files.
			 * @param {boolean} isRequired - Whether the field is required.
			 * @return {string} The validation result.
			 */
			file: ( value, isRequired ) => {
				if ( isEmptyValue( value ) ) {
					return isRequired ? 'is_required' : 'yes';
				}

				if ( value.some( file => file.error ) ) {
					return 'invalid_file_has_errors';
				}

				if ( value.some( file => ! file.isUploaded ) ) {
					return 'invalid_file_uploading';
				}

				return 'yes';
			},
		},

		// Both getters tolerate a missing `files`: they live in the shared form store now, so a
		// stray binding from a non-file field would otherwise throw rather than read as "empty".
		get hasFileFieldFiles() {
			return getFileFieldFiles().length > 0;
		},

		get isFileFieldFull() {
			return getFileFieldExtra().maxFiles <= getFileFieldFiles().length;
		},
	},

	actions: {
		onFileDropzoneKeyDown: event => {
			if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
				event.preventDefault();
				actions.openFilePicker( event );
			}
		},

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
			// A drop fires no focus event, so the form's `focusin` handler never sees it.
			// Without this, dropping a file and submitting would report the fill as starting
			// at the submit button rather than at the drop.
			actions.trackFirstInteraction();
			if ( event.dataTransfer ) {
				for ( const item of Array.from( event.dataTransfer.items ) ) {
					// Directories are skipped rather than aborting the whole drop: returning here
					// discarded every remaining file in a mixed selection and left `isDropping`
					// set, stranding the dropzone in its drag-hover style.
					if ( item.webkitGetAsEntry()?.isDirectory ) {
						continue;
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
		onFileDragOver: event => {
			const context = getContext();
			context.isDropping = true;
			event.preventDefault();
		},

		/**
		 * Handle drag leave event.
		 */
		onFileDragLeave: () => {
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
			const { endpoint, i18n } = getConfig( CONFIG_NAMESPACE );

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
		 * Reset the files in the context.
		 */
		resetFiles: () => {
			const context = getContext();
			context.files = [];
		},

		/**
		 * Remove a file from the context and cancel its upload if in progress.
		 *
		 * @param {Event} event - The event object.
		 * @yield {Promise<string>} The upload token.
		 */
		removeFile: function* ( event ) {
			event.preventDefault();

			const context = getContext();
			const clientFileId = event.target.dataset.id;

			// Cancel the upload if it's in progress
			if ( uploadControllers.has( clientFileId ) ) {
				const abortController = uploadControllers.get( clientFileId );
				abortController.abort(); // Cancel the upload
				uploadControllers.delete( clientFileId ); // Clean up the controller
			}

			const file = context.files.find( fileObject => fileObject.id === clientFileId );
			if ( file && file.url ) {
				// Remove the object URL to free up memory
				const urlToRemove = file.url.substring( 4, file.url.length - 1 );
				URL.revokeObjectURL( urlToRemove );
			}

			if ( file && file.file_id ) {
				const { endpoint } = getConfig( CONFIG_NAMESPACE );
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
			// Remove the file from the context. An empty array is a legitimate value here — the
			// registered validator turns it into `is_required` or `yes` as appropriate.
			context.files = context.files.filter( fileObject => fileObject.id !== clientFileId );
			actions.updateField( context.fieldId, context.files );
		},

		removeFileKeydown: event => {
			if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
				event.preventDefault();
				actions.removeFile( event );
			}
		},
	},

	callbacks: {
		/**
		 * Move focus to a newly added file preview.
		 *
		 * The preview carries `tabindex="0"` and an `aria-label` of the file name, so it is the
		 * only meaningful focus target once a file is added — the dropzone is hidden as soon as
		 * `state.isFileFieldFull` becomes true, and focusing a hidden element strands keyboard users.
		 */
		focusFilePreview: () => {
			const { ref } = getElement();
			setTimeout( () => {
				ref.focus( { focusVisible: true } );
			}, 100 );
		},
	},
} );
