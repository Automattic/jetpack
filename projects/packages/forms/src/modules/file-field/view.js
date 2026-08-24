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

// Long enough for the preview to be rendered and the dropzone hidden before focus moves.
const PREVIEW_FOCUS_DELAY_MS = 100;

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
 * The cache is written inside the shared promise rather than by each awaiting caller. Writing it
 * in the continuation would leave a microtask-sized window where `pendingTokenRequest` has already
 * been cleared but `uploadToken` is not yet set, letting a second caller past both guards and
 * start a redundant request — and with two in flight the last one to resolve would win, which can
 * leave the cache holding the older token and the earlier expiry.
 *
 * @return {Promise<string|null>} The upload token, or null if one could not be obtained.
 */
const getUploadToken = async () => {
	// Check if the token exists and is not expired
	if ( uploadToken && tokenExpiry && Date.now() < tokenExpiry ) {
		return uploadToken;
	}

	if ( ! pendingTokenRequest ) {
		pendingTokenRequest = fetchUploadToken()
			.then( ( { token, expiresAt } ) => {
				uploadToken = token;
				// A non-numeric expiry would make every later `Date.now() < tokenExpiry` false and
				// silently disable the cache for the rest of the page, so treat it as expired now
				// and re-fetch next time instead.
				tokenExpiry = Number.isFinite( expiresAt ) ? expiresAt * 1000 : 0;
				return token;
			} )
			.finally( () => {
				pendingTokenRequest = null;
			} );
	}

	return pendingTokenRequest;
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
 * The files currently held by the field.
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
 * XHR events can outlive the entry they describe — `resetFiles` empties the list without waiting
 * for anything in flight — so a missing file is an expected outcome here, not an error. Without
 * the guard, `findIndex` returns -1 and `Object.assign( undefined, … )` throws out of a progress
 * handler and takes the rest of the upload's reporting with it.
 *
 * @param {object} updatedFile  - The updated file object.
 * @param {string} clientFileId - The client file ID.
 */
const updateFileContext = ( updatedFile, clientFileId ) => {
	const context = getContext();
	const index = context.files.findIndex( file => file.id === clientFileId );

	if ( index === -1 ) {
		return;
	}

	context.files[ index ] = Object.assign( context.files[ index ], updatedFile );

	actions.updateField( context.fieldId, context.files );
};

/**
 * Ask the server to drop an already-uploaded file.
 *
 * Deliberately not awaited by the caller: the field's own state is updated first so the UI never
 * waits on the network. Safe to run after the interactivity scope is gone, since `getConfig()`
 * with an explicit namespace reads the global config map rather than the current scope.
 *
 * @param {string} fileId - The server-side file ID.
 */
const deleteUploadedFile = async fileId => {
	const token = await getUploadToken();

	if ( ! token ) {
		return;
	}

	const { endpoint } = getConfig( CONFIG_NAMESPACE );
	const formData = new FormData();
	formData.append( 'token', token );
	formData.append( 'file_id', fileId );

	try {
		await fetch( `${ endpoint }/remove`, { method: 'POST', body: formData } );
	} catch {
		// The file is already gone from the field either way; a failed cleanup call is not
		// something the visitor can act on.
	}
};

/**
 * Release everything attached to a file: its in-flight upload and its preview object URL.
 *
 * Shared by `removeFile` and `resetFiles` so the two cannot drift — a reset that skipped this
 * left the XHR running against a file nothing referenced any more, pinned the blob URL for the
 * life of the page, and leaked the controller into `uploadControllers`.
 *
 * @param {object} file - The file entry to release.
 */
const releaseFile = file => {
	if ( ! file ) {
		return;
	}

	const abortController = uploadControllers.get( file.id );
	if ( abortController ) {
		abortController.abort();
		uploadControllers.delete( file.id );
	}

	if ( file.url ) {
		// Strip the `url(…)` wrapper the style binding needs to get back to the blob URL.
		URL.revokeObjectURL( file.url.substring( 4, file.url.length - 1 ) );
	}
};

const { state, actions, callbacks } = store( NAMESPACE, {
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
			// Holding the key down would otherwise reopen the picker on every auto-repeat.
			if ( event.repeat ) {
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
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
					// Dragging selected text, a link or an image from another tab yields items with
					// `kind === 'string'`. Those return null from both `webkitGetAsEntry()` and
					// `getAsFile()`, so they have to be filtered before either is dereferenced.
					if ( item.kind !== 'file' ) {
						continue;
					}
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

			// The token round-trip suspends this generator, and there is no AbortController
			// registered yet — so a removal during that window has nothing to cancel and returns as
			// though it worked. Without this check the upload would resume and send a file the user
			// already deleted. Sharing one token request across a batch widens the window, since
			// files now queue behind a single fetch rather than each firing their own.
			const context = getContext();
			if ( ! context.files.some( fileObject => fileObject.id === clientFileId ) ) {
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
		 * Reset the field, releasing anything the files still hold. See `releaseFile()`.
		 */
		resetFiles: () => {
			const context = getContext();
			context.files.forEach( releaseFile );
			/*
			 * Empty in place rather than reassigning. The legacy back-compat alias
			 * (`bridgeLegacyContext`) points the old markup's context at this same array by
			 * reference, so a reassignment would strand the old `data-wp-each--file` binding on the
			 * previous array and leave removed files visible.
			 */
			context.files.splice( 0 );
		},

		/**
		 * Remove a file from the context and cancel its upload if in progress.
		 *
		 * The UI update happens first and the server-side delete is fired without blocking it.
		 * Waiting on a token round-trip before removing the entry left the preview in place and
		 * the dropzone hidden — `state.isFileFieldFull` still counted the file — so a slow or
		 * failed network made the field look stuck with no way to add a replacement.
		 *
		 * @param {Event} event - The event object.
		 */
		removeFile: event => {
			event.preventDefault();

			const context = getContext();
			const clientFileId = event.target.dataset.id;
			const file = context.files.find( fileObject => fileObject.id === clientFileId );

			// A second activation while the first is still settling would revoke an already-revoked
			// URL and POST a duplicate delete.
			if ( ! file ) {
				return;
			}

			releaseFile( file );

			/*
			 * Remove in place rather than reassigning `context.files`. The legacy back-compat alias
			 * (`bridgeLegacyContext`) shares this array with the old markup's context by reference, so
			 * a reassignment would leave the old `data-wp-each--file` binding on the stale array,
			 * keeping a removed file visible. An empty array is a legitimate value here — the
			 * registered validator turns it into `is_required` or `yes` as appropriate.
			 */
			const index = context.files.indexOf( file );
			if ( index !== -1 ) {
				context.files.splice( index, 1 );
			}
			actions.updateField( context.fieldId, context.files );

			if ( file.file_id ) {
				deleteUploadedFile( file.file_id );
			}
		},

		removeFileKeydown: event => {
			// Holding the key down would otherwise fire a second removal at the repeat rate.
			if ( event.repeat ) {
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
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
		 *
		 * The returned function is the effect cleanup: `data-wp-init` resolves the callback without
		 * invoking it, calls it once, and hands whatever it returns to Preact's `useEffect` as the
		 * teardown. So this runs when the preview unmounts — that is, when the file is removed —
		 * and hands focus back to the dropzone, which is visible again by then. Without it, removal
		 * destroys the focused element and focus falls to `<body>`.
		 *
		 * The container is captured while the preview is still attached: by cleanup time the node
		 * is detached, so `ref.closest()` would return null and querying it would throw.
		 *
		 * @return {Function} Cleanup that cancels the pending focus and restores it to the dropzone.
		 */
		focusFilePreview: () => {
			const { ref } = getElement();
			const container = ref.closest( '.jetpack-form-file-field__container' );

			// `isConnected` guards the case where the file is removed inside the delay: focusing a
			// detached node is a silent no-op that would strand focus on `<body>`.
			const focusTimer = setTimeout( () => {
				if ( ref.isConnected ) {
					ref.focus( { focusVisible: true } );
				}
			}, PREVIEW_FOCUS_DELAY_MS );

			return () => {
				clearTimeout( focusTimer );

				const dropzone = container?.querySelector( '.jetpack-form-file-field__dropzone-inner' );

				/*
				 * Nothing cancels this second timer, so check at fire time that focus is still
				 * the orphan this callback exists to rescue. Destroying the focused preview drops
				 * focus to `<body>`; if the visitor has since tabbed or clicked to a real element,
				 * moving them to the dropzone would be stealing focus rather than restoring it.
				 */
				setTimeout( () => {
					if ( ! dropzone?.isConnected ) {
						return;
					}

					const { activeElement, body } = dropzone.ownerDocument;

					if ( ! activeElement || activeElement === body ) {
						dropzone.focus( { focusVisible: true } );
					}
				}, PREVIEW_FOCUS_DELAY_MS );
			};
		},
	},
} );

/*
 * Back-compatibility shim for markup cached before this change. Remove one release after this
 * ships, along with the `@deprecated` note in the changelog.
 *
 * A page cache can serve HTML carrying `data-wp-interactive="jetpack/field-file"` against this
 * bundle, and that fails silently: the runtime auto-creates an empty store for an unknown
 * namespace rather than erroring, so every directive in the container becomes a no-op with no
 * console output outside SCRIPT_DEBUG. On a *required* file field it is unrecoverable — the
 * wrapper is still `jetpack/form`, so `registerField` records `is_required`, no file can ever be
 * added to clear it, and the submit gate blocks the form permanently.
 *
 * (The mirror case, new markup against a stale bundle, is handled by the content-hash suffix in
 * `enqueue_file_field_assets()` rather than here.)
 */
/**
 * Point the shared context at the legacy one so the new implementation can run against old markup.
 *
 * Old markup declared `files` under `jetpack/field-file` and carried `maxFiles`/`allowedMimeTypes`
 * as loose context keys rather than in `fieldExtra`. Assigning the same array reference rather than
 * a copy matters: the old template's `data-wp-each--file` still binds to the legacy context, so
 * both bindings have to observe the same underlying object to stay in step.
 */
const bridgeLegacyContext = () => {
	const legacy = getContext( CONFIG_NAMESPACE );
	const shared = getContext( NAMESPACE );

	if ( ! legacy || ! shared ) {
		return;
	}

	if ( shared.files === undefined ) {
		shared.files = legacy.files;
	}

	/*
	 * Test for the key rather than for a truthy value or for `fieldExtra` itself.
	 *
	 * `! shared.fieldExtra` never fires: the wrapper carrying old markup is the unchanged PHP of
	 * the previous release, which emitted `fieldExtra` for a file field as `get_field_extra()`'s
	 * untouched `$extra_attrs` — an empty array, which `wp_json_encode()` writes as `[]` and JS
	 * reads as truthy. The allowlist then stays empty and every file is rejected as a disallowed
	 * type.
	 *
	 * Testing the value (`! shared.fieldExtra?.allowedMimeTypes`) fixes that but is not idempotent:
	 * this runs inside the `hasFiles`/`hasMaxFiles` getters, which the runtime evaluates in a
	 * computed, and a legacy context with no usable list would assign a fresh object on every
	 * evaluation, invalidating the computed that just read it and spinning the main thread. Keying
	 * on the property means the second call is always a no-op.
	 */
	if ( ! shared.fieldExtra || ! ( 'allowedMimeTypes' in shared.fieldExtra ) ) {
		shared.fieldExtra = {
			maxFiles: legacy.maxFiles,
			allowedMimeTypes: legacy.allowedMimeTypes,
		};
	}
};

/*
 * Look the delegate up by name at call time rather than closing over it.
 *
 * `actions` and `callbacks` are store proxies, and the proxy's `get` trap is what binds a
 * function to a scope: it returns `withScope( fn )`, and `withScope()` captures `getScope()` at
 * the moment of the property read. Reading `actions.removeFile` while this module is still
 * evaluating captures an empty scope stack, so every later call would run `setScope( undefined )`
 * and the first `getContext()` inside would throw on `scope.context`. Deferring the read to call
 * time means the proxy binds the scope the runtime has already pushed for the directive.
 */
const withLegacyContext =
	actionName =>
	( ...args ) => {
		bridgeLegacyContext();
		return actions[ actionName ]( ...args );
	};

/*
 * The names above are strings, so renaming a shared action would not update them and nothing would
 * notice until a visitor on stale cached HTML hit a `TypeError`. Reading each one here (without
 * calling it) turns that into a console warning on every page load carrying the field. Reading is
 * safe: the proxy's `get` trap only binds a scope for the caller it returns, and this discards it.
 */
const assertLegacyDelegatesExist = names => {
	if ( ! globalThis.SCRIPT_DEBUG ) {
		return;
	}

	const missing = names.filter( name => typeof actions[ name ] !== 'function' );

	if ( missing.length ) {
		// eslint-disable-next-line no-console
		console.warn(
			`jetpack/field-file back-compat shim: no such action(s) on jetpack/form: ${ missing.join(
				', '
			) }`
		);
	}
};

store( CONFIG_NAMESPACE, {
	state: {
		get hasFiles() {
			bridgeLegacyContext();
			return state.hasFileFieldFiles;
		},
		get hasMaxFiles() {
			bridgeLegacyContext();
			return state.isFileFieldFull;
		},
	},
	actions: {
		handleKeyDown: withLegacyContext( 'onFileDropzoneKeyDown' ),
		openFilePicker: withLegacyContext( 'openFilePicker' ),
		fileAdded: withLegacyContext( 'fileAdded' ),
		fileDropped: withLegacyContext( 'fileDropped' ),
		removeFile: withLegacyContext( 'removeFile' ),
		removeFileKeydown: withLegacyContext( 'removeFileKeydown' ),
		resetFiles: withLegacyContext( 'resetFiles' ),

		// The old template binds `is-dropping` to the legacy context, so these write there directly
		// rather than delegating to handlers that would set the flag on the shared context.
		dragOver: event => {
			getContext( CONFIG_NAMESPACE ).isDropping = true;
			event.preventDefault();
		},
		dragLeave: () => {
			getContext( CONFIG_NAMESPACE ).isDropping = false;
		},
	},
	callbacks: {
		// Read through the proxy at call time, for the reason given on `withLegacyContext()`.
		focusElement: ( ...args ) => callbacks.focusFilePreview( ...args ),
	},
} );

assertLegacyDelegatesExist( [
	'onFileDropzoneKeyDown',
	'openFilePicker',
	'fileAdded',
	'fileDropped',
	'removeFile',
	'removeFileKeydown',
	'resetFiles',
] );
